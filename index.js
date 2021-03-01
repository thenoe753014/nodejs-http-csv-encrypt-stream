const http = require("http");
const crypto = require("crypto");
const { Transform } = require("stream");

const split2 = require("split2");

const algorithm = "aes-128-ctr";
const password = Buffer.from("fstk1234");
const salt = Buffer.from("我的天啊");

const key = crypto.scryptSync(password, salt, 16);
const iv = Buffer.alloc(16, 0);

const f1 = () => {
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

const f2 = () => {
  let first_line = true;

  return new Transform({
    transform(chunk, encoding, callback) {
      const decipher = crypto.createDecipheriv(algorithm, key, iv);

      if (first_line === true) {
        first_line = false;
        return callback(null, chunk);
      }

      const line = chunk
        .toString()
        .split(",")
        .map((v) => decipher.update(v, "base64").toString("utf8"))
        .join(",");

      decipher.final();

      callback(null, line);
    },
  });
};

const server1 = http.createServer((req, res) => {
  console.time("encrypt req time");

  let i = 0;

  req.setEncoding("utf8");

  req
    .pipe(split2())
    .pipe(f1())
    .on("data", (chunk) => {
      i++;
      res.write(chunk);
      res.write("\r\n");
    })
    .on("end", () => {
      res.end();
      console.timeEnd("encrypt req time");
      console.log("lines:", i);
    });
});

server1.listen(3000);

const server2 = http.createServer((req, res) => {
  console.time("decrypt req time");

  let i = 0;

  req.setEncoding("utf8");

  req
    .pipe(split2())
    .pipe(f2())
    .on("data", (chunk) => {
      i++;
      res.write(chunk);
      res.write("\r\n");
    })
    .on("end", () => {
      res.end();
      console.timeEnd("decrypt req time");
      console.log("lines:", i);
    });
});

server2.listen(3001);
