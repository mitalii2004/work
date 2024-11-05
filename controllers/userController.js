"use strict";

const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const helper = require("../helpers/validation");
const Models = require("../models/index");
const secretKey = "secretKey";

module.exports = {
  signUp: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required()
      })

      let payload = await helper.validationJoi(req.body, schema)

      const hashedPassword = await bcrypt.hash(payload.password, 10)

      let objToSave = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword
      }

      let response = await Models.userModel.create(objToSave)
      res.json({ message: "user registered successfully!", response })

    } catch (error) {
      console.log(error)
      throw error
    }
  },

  login: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
        deviceToken: "abc"
      })

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email, password } = value

      const user = await Models.userModel.findOne({ where: { email } })

      if (!user) {
        res.json({ message: "user not found" })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        res.json({ message: "password is not valid" })
      }

      jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: "1h" },
        (err, token) => {
          if (err) {
            return res.status(500).json({ message: "Error generating token" });
          }

          jwt.verify(token, secretKey, (verifyErr, authData) => {
            if (verifyErr) {
              return res.status(500).json({ message: "Error verifying token" });
            }

            res.json({ token, authData });
          });

          res.json({ token });
        }
      );
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        deviceToken: Joi.string().required().allow(""),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      let logoutDetail = {
        deviceToken: value.deviceToken,
      };

      await Models.userModel.update(logoutDetail, {
        where: { id: req.user.id },
      });

      res.json({ message: "User logout successfully!" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }


}