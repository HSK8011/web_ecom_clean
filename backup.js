const fs = require("fs"); const content = fs.readFileSync("src/components/Cart.jsx", "utf8"); fs.writeFileSync("src/components/Cart.jsx.bak", content);
