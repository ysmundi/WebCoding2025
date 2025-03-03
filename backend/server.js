const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

// const port = 9093;
const port = 3000;

//Listen on port 3000 or from process.env.PORT
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
