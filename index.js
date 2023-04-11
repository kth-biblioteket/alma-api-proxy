
require('dotenv').config({ path: 'alma-api-proxy.env'})
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios')

const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({ 
    origin: ['https://exlibrisgroup.com', 'http://localhost:8003']
}));

const appRoutes = express.Router();



appRoutes.get("/", async function (req, res, next) {
    let adminuser = false
    //Verifiera token från Primo
    decodedtoken = verifytoken(req.query.jwt)
    if (decodedtoken!=0) {
        //Kontrollera användarens roller
        try {
            const almauser = await axios.get(process.env.ALMAPIENDPOINT + 'users/' + decodedtoken.userName + '?apikey=' + process.env.ALMAAPIKEY)
            for (let index = 0; index < almauser.data.user_role.length; index++) {
                const element = almauser.data.user_role[index].role_type.desc;
                if(element.indexOf("User Manager") !== -1) {
                    adminuser = true;
                } else {
                    res.status(400)
                    res.json("Not authorized!");
                }
            }
        } catch(err) {
            res.status(400)
            res.json(err.message);
        }

        try {
            if(adminuser) {
                const almaresponse = await axios.get(process.env.ALMAPIENDPOINT + req.query.apipath + '?apikey=' + process.env.ALMAAPIKEY)
                res.json(almaresponse.data);
            }
        } catch(err) {
            res.status(400)
            res.json(err.message);
        }
    } else {
        res.status(400)
        res.json("None or not a valid token");
    }
})

appRoutes.post("/activatepatron", async function (req, res, next) {
    decodedtoken = verifytoken(req.query.jwt)
    if (decodedtoken!=0) {
        try {
            //hämta user objekt
            almapiurl = process.env.ALMAPIENDPOINT + 'users/' + decodedtoken.userName + '?apikey=' + process.env.ALMAAPIKEY
            console.log(almapiurl)
            const almauser = await axios.get(almapiurl)
            
            //Lägg till user note i hämtat userobjekt
            almauser.data.user_note.push({
                "note_type": {
                    "value": "POPUP",
                    "desc": "General"
                },
                "note_text": "Activated from Primo",
                "segment_type": "Internal"
            })
            //Uppdatera patron rollen i hämtat userobjekt till att vara aktiv
            let patronrole = false
            for (let index = 0; index < almauser.data.user_role.length; index++) {
                const element = almauser.data.user_role[index].role_type.desc;
                if(element.indexOf("Patron") !== -1) {
                    almauser.data.user_role[index].status.desc="Active"
                    almauser.data.user_role[index].status.value="ACTIVE"
                    result = "OK"
                    patronrole = true
                    break;
                } else {
                    res.status(400)
                    res.json("User does not have a patron role!");
                }
            }
            //Uppdatera pincode
            if(req.body.pin_number) {
                almauser.data.pin_number = req.body.pin_number
            } else {
                res.status(400)
                res.json("Error, No pincode provided")
            }

            //Uppdatera preferred language
            if(req.body.language_value && req.body.language_desc) {
                almauser.data.preferred_language.value = req.body.language_value
                almauser.data.preferred_language.desc = req.body.language_desc
            } else {
                res.status(400)
                res.json("Error, No preferred language provided")
            }
            
            const almaresult = await axios.put(almapiurl, almauser.data)
            
            res.json("success");
        } catch(err) {
            res.status(400)
            res.json(err)
        }
    } else {
        res.status(400)
        res.json("None or not valid token")
    }
});

appRoutes.put("/activatepatron", async function (req, res, next) {
    decodedtoken = verifytoken(req.params.jwt)
    if (decodedtoken!=0) {
        try {  
            almapiurl = process.env.ALMAPIENDPOINT + req.params.apipath + '&apikey=' + process.env.ALMAAPIKEY
            const almaresponse = await axios.put(almapiurl, data, )
            res.json(almaresponse);
        } catch(err) {
            res.status(400)
            res.json(err.message)
        }
    } else {
        res.status(400)
        res.json("None or not valid token")
    }
});

appRoutes.delete("/", async function (req, res, next) {

    let adminuser = false
    //Verifiera token från Primo
    decodedtoken = verifytoken(req.query.jwt)
    if (decodedtoken!=0) {
        //Kontrollera användarens roller
        try {
            const almauser = await axios.get(process.env.ALMAPIENDPOINT + 'users/' + decodedtoken.userName + '?apikey=' + process.env.ALMAAPIKEY)
            for (let index = 0; index < almauser.data.user_role.length; index++) {
                const element = almauser.data.user_role[index].role_type.desc;
                if(element.indexOf("User Manager") !== -1) {
                    adminuser = true;
                } else {
                    res.status(400)
                    res.json("Not authorized!");
                }
            }
        } catch(err) {
            res.status(400)
            res.json(err.message);
        }

        try {
            if(adminuser) {
                const almaresponse = await axios.delete(process.env.ALMAPIENDPOINT + req.query.apipath + '?apikey=' + process.env.ALMAAPIKEY)
                res.json(almaresponse);
            }
        } catch(err) {
            res.status(400)
            res.json(err.message);
        }
    } else {
        res.status(400)
        res.json("None or not a valid token");
    }
});

app.use(process.env.API_ROUTES_PATH, appRoutes);

const server = app.listen(process.env.PORT || 3002, function () {
    const port = server.address().port;
    console.log("App now running on port", port);
});

function verifytoken(tokenValue) {
    //public key: https://api-eu.hosted.exlibrisgroup.com/auth/46KTH_INST/jwks.json
    //public key: https://api-eu.hosted.exlibrisgroup.com/auth/46KTH_INST/jwks.json?env=sandbox
    var keys = {
        kty: "EC",
        kid: "primaPrivateKey-46KTH_INST",
        use: "sig",
        x: process.env.EXLIBRISPUBLICKEY_X,
        y: process.env.EXLIBRISPUBLICKEY_Y,
        crv: "P-256",
        alg: "ES256"
    }

    var pem = jwkToPem(keys);

    try {
        var token = jwt.verify( tokenValue, pem )
        return token
    } catch (err) {
        return 0
    }

}
