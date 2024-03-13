const mongoose = require("mongoose");

const imageDetailsSchema = mongoose.Schema(
    {

        name: {
            type: String,
        },
        age: {
            type: Number,
        },

        imageUrl: {
            type: String,
        }

    },
    { timestamps: true }
);

const imageDetails = mongoose.model("imageDetails", imageDetailsSchema);
module.exports = imageDetails;