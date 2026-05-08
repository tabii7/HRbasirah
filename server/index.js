require("dotenv").config();

const app = require("./app");
const { PORT } = require("./config/constants");

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
