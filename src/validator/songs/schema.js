const Joi = require('joi');

const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1970).max(2020)
    .required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer(),
  albumId: Joi.string(),
});

module.exports = { SongPayloadSchema };
