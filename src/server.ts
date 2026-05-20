import app from "./app";
import { initDB } from "./db";

const main=()=>{
    initDB()
    app.listen(5000,()=>{
       console.log("Server is running on port 5000"); 
    })}

    main()