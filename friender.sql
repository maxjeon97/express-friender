\echo 'Delete and recreate friender db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE friender;
CREATE DATABASE friender;
\connect friender


CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  hobbies TEXT NOT NULL,
  interests TEXT NOT NULL,
  location VARCHAR(5) NOT NULL,
  friend_radius INTEGER NOT NULL);

CREATE TABLE messages (
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  from_username TEXT NOT NULL REFERENCES users,
  to_username TEXT NOT NULL REFERENCES users,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE);

CREATE TABLE viewed_users (
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  viewing_username TEXT NOT NULL REFERENCES users,
  viewed_username TEXT NOT NULL REFERENCES users,
  liked BOOLEAN NOT NULL);

CREATE TABLE friends (
  username1 TEXT NOT NULL REFERENCES users,
  username2 TEXT NOT NULL REFERENCES users,
  PRIMARY KEY (username1, username2));

\echo 'Delete and recreate friender_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE friender_test;
CREATE DATABASE friender_test;
\connect friender_test

CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  hobbies TEXT NOT NULL,
  interests TEXT NOT NULL,
  location VARCHAR(5) NOT NULL,
  friend_radius INTEGER NOT NULL);

CREATE TABLE messages (
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  from_username TEXT NOT NULL REFERENCES users,
  to_username TEXT NOT NULL REFERENCES users,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE);

CREATE TABLE viewed_users (
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  viewing_username TEXT NOT NULL REFERENCES users,
  viewed_username TEXT NOT NULL REFERENCES users,
  liked BOOLEAN NOT NULL);

CREATE TABLE friends (
  username1 TEXT NOT NULL REFERENCES users,
  username2 TEXT NOT NULL REFERENCES users,
  PRIMARY KEY (username1, username2));

