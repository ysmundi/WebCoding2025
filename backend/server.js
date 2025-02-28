const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const port = process.env.PORT;

//Listen on port 3000 or from process.env.PORT
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
