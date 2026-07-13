"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let db;
let auth;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized using inline service account JSON.');
    }
    else if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log('Firebase Admin SDK initialized using application default credentials.');
    }
    else {
        // Development Mock/Fallback setup if credentials aren't provided yet
        console.warn('WARNING: Firebase configurations not found. Running in Development Fallback Mode.');
        // Initialize with a dummy config for structural verification
        admin.initializeApp({
            projectId: 'sabi-return-gifts-mock',
        });
    }
    exports.db = db = admin.firestore();
    exports.auth = auth = admin.auth();
    // Set Firestore settings
    db.settings({ ignoreUndefinedProperties: true });
}
catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    // Fallback to avoid process crash
    exports.db = db = {};
    exports.auth = auth = {};
}
