# importing libraries
import mysql.connector  # For connecting to and interacting with the MySQL database
import socket  # For creating network connections
import pickle  # For serializing and deserializing data
from _thread import *  # For creating new threads

HOST = '127.0.0.1'  # Database host
PORT = 3306  # Database port (MySQL default port)

# Establishing a connection to the MySQL database
mydb = mysql.connector.connect(
    host=HOST,                  # Database host
    user='root',                # <--  the username for the database
    password='aisharamjaun',    # <--  the user password for the database
    database='vendingmachine'         # <--  the name of the database to connect to
)


def handle_client(client_socket):
    """
    Function to handle client connection.
    Fetches product data and processes orders from the client.
    """
    # Cursor is used to execute statements to communicate with the MYSQL database
    # buffered=True enable to execute different queries
    cursor = mydb.cursor(buffered=True)  # Create a cursor object to interact with the database

    try:
        while True:  # infinite loop to prevent the connection from closing
            # Fetch all products from the database
            cursor.execute("SELECT * FROM products")
            products_data = cursor.fetchall()  # Retrieve all rows from the executed query

            # Send the products data to the client
            client_socket.send(pickle.dumps(products_data))  # Serialize and send data to client

            # Receive and process orders from the client
            order_data = pickle.loads(client_socket.recv(4096))  # Deserialize and receive data from client

            if order_data['action'] == 'create_order':
                # Update the product quantities based on the order
                for item in order_data['items']:
                    cursor.execute("UPDATE products SET quantity = quantity - %s WHERE product_id = %s",
                                   (item['quantity'], item['product_id']))  # Update database
                mydb.commit()  # Commit the changes to the database

                # Send confirmation back to the client
                client_socket.send(pickle.dumps({'status': 'Order placed successfully'}))  # Send acknowledgment

            elif order_data['action'] == 'cancel_order':
                # Handle the cancellation and update the product quantities
                for order in order_data['orders']:
                    if order:
                        product_id, product_name, purchase_qty = int(order[0]), order[1], int(order[2])
                        cursor.execute("UPDATE products SET quantity = quantity + %s WHERE product_id = %s",
                                       (purchase_qty, product_id))  # Update database
                mydb.commit()  # Commit the changes to the database

                # Send confirmation back to the client
                client_socket.send(pickle.dumps({'status': 'Order cancelled successfully'}))  # Send acknowledgment

    except Exception as e:
        # Print any exceptions and close the client socket
        print(f"Error: {e}")
        client_socket.close()  # Close the socket connection with the client


def main():
    """
    Main function to set up the server.
    Binds the server to an address and port, and listens for incoming connections.
    """

    # Create a server socket
    # AF.INET refers to the address family IPV4
    # SOCK_STREAM means connection oriented TCP protocol

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        # Bind the socket to the host and port
        server.bind(('0.0.0.0', 9998))  # Bind to all network interfaces on port 9999
        server.listen(5)  # Listen for incoming connections (max 5 in the queue)
        print("Server listening on port 9999")  # Print a message to indicate the server is running

        while True:
            # Accept a new client connection
            client_socket, addr = server.accept()  # Accept a new connection
            print(f"Accepted connection from {addr}")  # Print the address of the connected client

            # Start a new thread to handle the client connection
            start_new_thread(handle_client, (client_socket,))  # Run the handle_client function in a new thread

    except socket.error as err:
        # Print any socket errors and close the server socket
        print(f"Socket error: {err}")
        server.close()  # Close the server socket


if __name__ == '__main__':
    main()  # Run the main function to start the server
