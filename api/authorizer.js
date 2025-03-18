const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const jwksClient = require('jwks-rsa');

const jwksUri = `${process.env.JUMPCLOUD_ISSUER}.well-known/jwks.json`
const jwksClientInstance = jwksClient({ jwksUri })

function getKey(jwtHeader, callback) {
    jwksClientInstance.getSigningKey(jwtHeader.kid, function (err, key) {
        if (err) {
            console.error('Error getting signing key:', err)
            callback(err)
        } else {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey)
        }
    })
}

function verifyJwtAsync(token, options) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, options, (err, decoded) => {
            if (err) reject(err)
            else resolve(decoded)
        })
    })
}

const client = new MongoClient(process.env.MONGODB_URI);
let db;


const userCache = new Map();
const CACHE_EXPIRY = 10 * 60 * 1000;

exports.handler = async (event) => {
    const tokenHeader = event.headers.authorization || event.headers.Authorization;
    const token = tokenHeader && tokenHeader.startsWith('Bearer ') ? tokenHeader.substring(7) : null;

    if (!token) {
        console.log("No Authorization header found");
        return generatePolicy("Deny", "User not authenticated");
    }
    let decoded;
    try {
        decoded = await verifyJwtAsync(token, {
            audience: process.env.JUMPCLOUD_AUDIENCE,
            issuer: process.env.JUMPCLOUD_ISSUER
        })
        console.log("Token successfully verified");
    } catch (error) {
        console.error("Token verification failed:", error);
        return generatePolicy("Deny", "Token verification failed");
    }
    // console.log("Decoded JWT token:", decoded)
    if (!decoded.email) {
        console.error("Decoded token does not contain 'email':", decoded);
        return generatePolicy("Deny", "Token missing email");
    }

    const userEmail = decoded.email.toLowerCase();


    const cachedUser = userCache.get(userEmail);
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_EXPIRY) {
        console.log(`${userEmail} found in cached memory, skipping DB lookup and authorizing access`);
        return generatePolicy("Allow", userEmail);
    }

    if (!db) {
        try {
            await client.connect();
            db = client.db("production2");
        } catch (e) {
            console.error("Failed to connect to MongoDB", e);
            return generatePolicy("Deny", "Database connection error");
        }

    }

    try {
        const userCollection = db.collection("pagoda_users");
        const userExists = await userCollection.findOne({ email: userEmail });

        if (userExists) {
            userCache.set(userEmail, { timestamp: Date.now() });
            console.log(`User ${userEmail} found in DB. Is authorized, generating policy...`);
            return generatePolicy("Allow", userEmail);
        } else {
            console.log(`User ${userEmail} not found in database, denying access`);
            return generatePolicy("Deny", "User not found in database");
        }
    } catch (error) {
        console.error("MongoDB query failed:", error);
        return generatePolicy("Deny", "Database error");
    }
};

function generatePolicy(effect, verifiedUserEmail) {
    const policyDocument = {
        principalId: verifiedUserEmail || "unauthenticated",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: "*"
                }
            ]
        },
        context: {
            user: verifiedUserEmail || "unauthenticated",
            message: effect === "Allow" ? "Access granted" : "Access denied"
        }
    };
    return policyDocument;
}
