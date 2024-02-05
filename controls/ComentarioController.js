'use strict';
const { body, validationResult } = require('express-validator');
const models = require('../models/');
const comentario = models.comentario;
const Sentiment = require('sentiment');

function analizarComentario(comentario) {
    const sentiment = new Sentiment();
    const resultado = sentiment.analyze(comentario);
    console.log('Resultado del análisis:', resultado);
    return resultado;
}

function getSentimentEmoji(score) {
    if (score > 0) {
        return '😊 Positivo';
    } else if (score < 0) {
        return '😢 Negativo';
    } else {
        return '😐 Neutro';
    }
}

class ComentarioController {
    async listar(req, res) {
        try {
            const listar = await comentario.findAll({
                attributes: ['coment', 'sentimiento', 'createdAt'] // Cambiado 'createAt' a 'createdAt'
            });
            res.json({ msg: 'OK!', code: 200, info: listar });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor", code: 500 });
        }
    }

    async guardar(req, res) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                res.status(400).json({ msg: "DATOS FALTANTES", code: 400, errors: errors.array() });
                return;
            }
            const resultado = analizarComentario(req.body.comentario);
            const data = {
                coment: req.body.comentario,
                sentimiento: getSentimentEmoji(resultado.score)
            };

            console.log(data);

            let transaction = await models.sequelize.transaction();

            try {
                // Crear comentario en la base de datos
                await comentario.create(data);

                await transaction.commit();
                res.status(200).json({ msg: "COMENTARIO CREADO CON EXITO", code: 200 });

            } catch (error) {
                if (transaction) await transaction.rollback();
                const errorMsg = error.errors && error.errors[0] && error.errors[0].message
                    ? error.errors[0].message
                    : error.message;
                res.json({ msg: errorMsg, code: 200 });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor", code: 500 });
        }
    }
}

module.exports = ComentarioController;
