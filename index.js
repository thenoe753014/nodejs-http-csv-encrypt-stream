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
        .map((v) => `'${cipher.update(v, "utf8").toString("hex")}'`)
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

function connectVerticaDB(config) {
  try {
    console.log("Connected to DATABASE");
    return Vertica.connect(config);
  } catch (err) {
    console.log("conn failure");
    return err;
  }
}

async function queryFromVerticaDB(sql) {
  const conn = connectVerticaDB(config);
  console.time("query from verticaDB time");

  conn.query(sql, (err, result) => {
    if (err) console.log("VSQL" + err);
    console.log(result);
    console.timeEnd("query from verticaDB time");
    conn.disconnect();
  });

  // const query = conn.query(`${sql};`);
  // query.on('fields', function(fields) {
  //   return console.log("Fields:", fields);
  // });
  // query.on('row', function(row) {
  //   return console.log(row);
  // });
  // query.on('end', function(status) {
  //   conn.disconnect();
  //   return console.log("Finished!", status);
  // });
  // query.on('error', function(err) {
  //   return console.log("Uh oh!", err);
  // });
}

const server1 = http.createServer((req, res) => {
  console.time("encrypt req time");

  // const conn = connectVerticaDB(config);
  let i = 0;

  req.setEncoding("utf8");

  let data = [];
  req
    .pipe(split2())
    .pipe(f1())
    .on("data", (chunk) => {
      i++;

      const sql = `SELECT ${chunk}`;
      data.push(sql);
    })
    .on("end", async () => {
      data.splice(0, 1);
      data = data.join(" UNION ALL ");

      const sql = `INSERT INTO poc.clnt_encrypted (client_id, id_ind, names, sex, birth_date, hometown, occupation_code, marriage, education,remit_bank,remit_branch,remit_account,transfer_bank,transfer_account,card_bank,credit_card_no,sign_ptn_card,risk_suit_seq,fatca_ind) with subtable as (${data}) select * from subtable;COMMIT;`;

      res.write(sql);
      res.write("\r\n");

      await queryFromVerticaDB(sql);

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
