import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
    path:path.join(process.cwd(), '.env')
});

 const config = {
  connectionString: process.env.CONNECTIONSTRING as string,
    jwtSecret: process.env.JWTSECRET as string
};

export default config;