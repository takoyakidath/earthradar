require("dotenv").config();

const env = {
  password: process.env.password,
};

// env.password を使用して値を表示
console.log(env.password);

export default env;
