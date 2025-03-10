CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    image_path VARCHAR(255)
);

INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (1, 'KitKat', 25, 150, 'Kitkat.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (2, 'Twix', 100, 100, 'Twix.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (3, 'Mars', 20, 200, 'Mars.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (4, 'Daim', 90, 300, 'Daim.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (5, 'MnMs', 85, 250, 'MnMs.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (6, 'Snickers', 40, 90, 'Snickers.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (7, 'Bounty', 70, 80, 'Bounty.png');
INSERT INTO products (product_id, name, price, quantity, image_path) VALUES (8, 'MilkyWay', 30, 110, 'MilkyWay.png');
