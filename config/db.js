const mongoose= require('mongoose');

const connectDB= async () =>{
    try {
        const  connection= await mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
        });
        console.log(`MongoDB Connected: ${connection.connection.host}`)
    }catch (error){
        console.log(error);
        process.exit();
    }
}
module.exports=connectDB;