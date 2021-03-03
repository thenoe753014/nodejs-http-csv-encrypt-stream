const Vertica = require("vertica");

const config = {
  host: "127.0.0.1",
  user: "dbadmin",
  password: "noel123",
  database: "docker",
};

const crypto = require("crypto");

const algorithm = "aes-128-ctr";
const password = Buffer.from("fstk1234");
const salt = Buffer.from("我的天啊");

const key = crypto.scryptSync(password, salt, 16);
const iv = Buffer.alloc(16, 0);

function connectVerticaDB(config) {
  try {
    console.log("Connected to DATABASE");
    return Vertica.connect(config);
  } catch (err) {
    console.log("conn failure");
    return err;
  }
}

async function decryption(config) {
  const conn = await connectVerticaDB(config);
  let de_insert_data = "";

  conn.query(
    `SELECT TO_HEX(name), TO_HEX(email), TO_HEX(address), TO_HEX(job), TO_HEX(company), TO_HEX(ssn), TO_HEX(phone), TO_HEX(birthdate), TO_HEX(bio), TO_HEX(license_plate), TO_HEX(card1), TO_HEX(card2), TO_HEX(card3), TO_HEX(card4) FROM poc.poc_encrypted_test LIMIT 2`,
    (err, result) => {
      if (err) console.log("VSQL" + err);

      const rows = result.rows;

      for (let i in rows) {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        line = rows[i]
          .map((v) => `'${decipher.update(v, "hex").toString("utf8")}'`)
          .join(",");
        decipher.final();
        de_insert_data += `INSERT INTO poc.poc_decrypted_test (name, email, address, job, company, ssn, phone, birthdate, bio, license_plate, card1, card2, card3, card4) VALUES (${line});`;
      }
      conn.query(`${de_insert_data}; COMMIT;`, (err, result) => {
        if (err) console.log("VSQL" + err);
        console.log(result);
      });
      conn.disconnect();
    }
  );
}

decryption(config);
