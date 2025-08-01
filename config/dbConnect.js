import mongoose from "mongoose"

const connectMongoDB = mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log("Veritabanına Başarıyla Bağlandı");
    })
    .catch((err) => {
        console.log("Veritabanına bağlanırken hata çıktı : ", err);
    })

export default connectMongoDB