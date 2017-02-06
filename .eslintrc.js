module.exports = {
    "env": {
        "node":true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        }
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "eol-last": [
            "error"
        ],
        "no-multiple-empty-lines": ["error", {"maxBOF": 0, "max": 3, "maxEOF": 0}],
        "no-trailing-spaces": ["error"],
        "indent": [
            "error",
            2
        ],
        "wrap-iife": ["error", "inside"],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "curly": "error",
        "no-case-declarations": "error",
        "valid-typeof": "error",
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
