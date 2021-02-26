const http = require("http");
const crypto = require("crypto");
const { Transform } = require("stream");

const split2 = require("split2");

const algorithm = "aes-128-ctr";
const password = Buffer.from("fstk1234");
const salt = Buffer.from("我的天啊");

const key = crypto.scryptSync(password, salt, 16);
const iv = Buffer.alloc(16, 0);

const f = () => {
  let first_line = true;

  return new Transform({
    transform(chunk, encoding, callback) {
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      if (first_line === true) {
        first_line = false;
        return callback(null, chunk);
      }

      const line = chunk
        .toString()
        .split(",")
        .map((v) => cipher.update(v, "utf8").toString("base64"))
        .join(",");

      cipher.final();

      callback(null, line);
    },
  });
};

const server = http.createServer((req, res) => {
  console.time("req time");

  let i = 0;

  req.setEncoding("utf8");

  req
    .pipe(split2())
    .pipe(f())
    .on("data", (chunk) => {
      i++;
      res.write(chunk);
      res.write("\r\n");
    })
    .on("end", () => {
      res.end();
      console.timeEnd("req time");
      console.log("lines:", i);
    });
});

server.listen(3000);
