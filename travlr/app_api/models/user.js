const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const CURRENT_PASSWORD_ITERATIONS = 310000;
const LEGACY_PASSWORD_ITERATIONS = 1000;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    hash: String,
    salt: String,
    passwordIterations: {
        type: Number,
        default: LEGACY_PASSWORD_ITERATIONS
    },
    role: {
        type: String,
        enum: ['admin'],
        default: 'admin'
    }
});

userSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.passwordIterations = CURRENT_PASSWORD_ITERATIONS;
    this.hash = crypto
        .pbkdf2Sync(password, this.salt, this.passwordIterations, 64, 'sha512')
        .toString('hex');
};

userSchema.methods.validPassword = function(password) {
    const iterations = this.passwordIterations || LEGACY_PASSWORD_ITERATIONS;
    const storedHash = Buffer.from(this.hash || '', 'hex');
    const providedHash = crypto.pbkdf2Sync(password, this.salt, iterations, 64, 'sha512');

    if (storedHash.length !== providedHash.length) {
        return false;
    }

    return crypto.timingSafeEqual(storedHash, providedHash);
};


// Method to generate a JSON Web Token for the current record
userSchema.methods.generateJWT = function() {
return jwt.sign(
{ // Payload for our JSON Web Token
_id: this._id,
email: this.email,
name: this.name,
role: this.role,
},
process.env.JWT_SECRET, //SECRET stored in .env file
{ expiresIn: '1h' }); //Token expires an hour from creation
};

const User = mongoose.model('users', userSchema);
module.exports = User;

mongoose.model('User', userSchema);
