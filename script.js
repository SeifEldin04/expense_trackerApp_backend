const tbluser = `
    CREATE TABLE IF NOT EXISTS tbluser (
        id SERIAL NOT NULL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50),
        password TEXT,
        contact VARCHAR(20),
        accounts TEXT[],
        country TEXT,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
`


const tblaccount = `
    CREATE TABLE IF NOT EXISTS tblaccount (
        id SERIAL NOT NULL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES tbluser(id),
        account_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
`


const tbltransaction = `
    CREATE TABLE IF NOT EXISTS tbltransaction (
        id SERIAL NOT NULL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES tbluser(id),
        description TEXT NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'Pending',
        source VARCHAR(100) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        type VARCHAR(10) NOT NULL DEFAULT 'income',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
`