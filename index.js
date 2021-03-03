const http = require("http");
const crypto = require("crypto");
const { Transform } = require("stream");

const split2 = require("split2");
const Vertica = require("vertica");
const algorithm = "aes-128-ctr";
const password = Buffer.from("fstk1234");
const salt = Buffer.from("我的天啊");

const key = crypto.scryptSync(password, salt, 16);
const iv = Buffer.alloc(16, 0);

const config = {
  host: "127.0.0.1",
  user: "dbadmin",
  password: "noel123",
  database: "docker",
};

const f1 = () => {
  let first_line = true;
  return Transform({
    transform(chunk, encoding, callback) {
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      if (first_line === true) {
        first_line = false;
        return callback(null, chunk);
      }

      const line = chunk
        .toString()
        .split(",")
        .map(
          (v) =>
            `HEX_TO_BINARY('0x${cipher.update(v, "utf8").toString("hex")}')`
        )
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
        .map((v) => {
          const c = decipher.update(v, "base64").toString("utf8");
          console.log(v);
          return c;
        })
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

  let data = [];
  req
    .pipe(split2())
    .pipe(f1())
    .on("data", (chunk) => {
      i++;

      const sql = `INSERT INTO poc.poc_encrypted_test (name, email, address, job, company, ssn, phone, birthdate, bio, license_plate, card1, card2, card3, card4) VALUES (${chunk})`;
      data.push(sql);
    })
    .on("end", () => {
      data.splice(0, 1);
      data = data.join(";");

      res.write(`${data}; COMMIT;`);
      res.write("\r\n");

      try {
        conn = Vertica.connect(config, (err, conn) => {
          if (err) {
            console.log("error: \n" + err);
          } else {
            conn.query(`${data}; COMMIT;`, (err, result) => {
              if (err) console.log("VSQL" + err);
              console.log(result);
            });
            conn.disconnect();
          }
        });
      } catch (error) {
        console.log("Error has been caught");
        console.log(error);
      }
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
