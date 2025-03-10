import tkinter as tk
from tkinter import Frame, Label, Button, StringVar, Entry, CENTER,  Message, IntVar, messagebox
import csv
from PIL import ImageTk, Image
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import mysql.connector
import os
import socket
import pickle

# Create a client socket
# AF.INET refers to the address family IPV4
# SOCK_STREAM means connection oriented TCP protocol
client_Socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# connects the client to the server IP address
client_Socket.connect(('localhost', 9998))


class Welcome(Frame):
    """
        Welcome Class
        Frame: Frame widget which may contain other widgets and can have a 3D border.
        This function will display the welcome message and prompt the user to order
    """

    def __init__(self, master):  # initialise constructor
        Frame.__init__(self, master)  # calls constructor from the superclass
        global timer
        global messagecode
        self.master.geometry("900x700+325+25")  # resize the window
        self.master.title("Welcome")
        timer = 6
        messagecode = 0

        # Frame to store all the widgets
        window_Frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_Frame.pack(side=tk.TOP)

        # Frame to store all the widgets
        details_Frame = Frame(window_Frame, width=700, height=650, highlightthickness="5", bg="PeachPuff2")
        details_Frame.place(x=100, y=25)

        # welcome message
        Label(details_Frame, text="WELCOME To", font=("Courier", 50), bg="PeachPuff2").place(x=150, y=50)
        Label(details_Frame, text=" AISHA'S ", font=("Courier", 44), bg="PeachPuff2").place(x=190, y=150)
        Label(details_Frame, text="VENDING MACHINE", font=("Courier", 44), bg="PeachPuff2").place(x=120, y=225)

        # Open the logo image
        logo = Image.open("logo.png")

        # Resize the logo image to desired dimensions
        logo = logo.resize((200, 200), Image.LANCZOS)  # Change dimensions as needed

        # Convert the resized image to PhotoImage( a format that Tkinter can display.)
        logoTk = ImageTk.PhotoImage(logo)

        # Display the resized image in a label
        picture_Label = Label(details_Frame, image=logoTk)
        picture_Label.image = logoTk
        picture_Label.place(x=250, y=410)

        # Button to proceed to the main menu
        Button(details_Frame, text="Order Now!", font=("Courier", 20), bg="NavajoWhite4",
               command=lambda: master.switchFrame(Menu)).place(x=245, y=315)


class ProductDetails(Frame):
    """
    this function will display product details and providing options to the user:
    1) Add Another
    2) Proceed and Pay
    3) Cancel
    """

    def __init__(self, master, individual_id, product_name, individual_price, purchase_qty):
        # Calls constructor from the superclass
        Frame.__init__(self, master)

        self.individual_id = individual_id
        self.product_name = product_name
        self.individual_price = individual_price
        self.purchase_qty = purchase_qty

        # Function to handle cancellation
        def Cancel():
            """
            Cancel will carry out the following operations:
            1) Send the current transactions to the server
            2) Empty the transaction.csv file to delete past orders
            3) Switch frame to message
            """
            global messagecode
            messagecode = 1

            # Read the current contents of the transaction.csv file
            with open('transactions.csv', 'r') as order_file:
                order_Content = csv.reader(order_file)
                order_list = list(order_Content)

            # Send the current transaction data to the server
            client_message = pickle.dumps(order_list)
            client_Socket.send(client_message)

            # Empty the transaction.csv file
            with open("transactions.csv", "w") as category_file:
                category_file.truncate(0)

            # Switch to the Message frame
            self.master.switchFrame(Message)

        # Resize the window
        self.master.geometry("900x700+325+25")

        # Frame to store all widgets
        window_frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_frame.pack(side=tk.TOP)

        # Frame to store the details
        details_frame = Frame(window_frame, width=700, height=500, highlightthickness="5", bg="PeachPuff2")
        details_frame.place(x=100, y=100)

        # Display Product ID
        Label(details_frame, text="Product", font=("Courier", 20), bg="PeachPuff2").place(x=30, y=10)
        Label(details_frame, text="ID", font=("Courier", 18), bg="PeachPuff2").place(x=50, y=47)
        Label(details_frame, text=self.individual_id, font=("Courier", 27), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=250, y=10)

        # Display Product Name
        Label(details_frame, text="Product", font=("Courier", 20), bg="PeachPuff2").place(x=30, y=100)
        Label(details_frame, text="Name", font=("Courier", 18), bg="PeachPuff2").place(x=50, y=137)
        if len(self.product_name) >= 15:
            shortened_text = self.product_name[0:15] + "..."
            Label(details_frame, text=shortened_text, font=("Courier", 30), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=250, y=100)
        else:
            Label(details_frame, text=self.product_name, font=("Courier", 30), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=250, y=100)

        # Display Price per Product
        Label(details_frame, text="Individual", font=("Courier", 20), bg="PeachPuff2").place(x=12, y=200)
        Label(details_frame, text="Price", font=("Courier", 18), bg="PeachPuff2").place(x=50, y=237)
        Label(details_frame, text=f'Rs {self.individual_price}', font=("Courier", 30), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=250, y=200)

        # Display Total Price
        total_price_per_product = int(self.individual_price) * int(
            self.purchase_qty)  # Calculate total cost per product
        Label(details_frame, text="Total Price", font=("Courier", 20), bg="PeachPuff2").place(x=10, y=300)
        Label(details_frame, text="Per Product", font=("Courier", 18), bg="PeachPuff2").place(x=30, y=337)
        Label(details_frame, text=f'Rs {total_price_per_product}', font=("Courier", 30), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=250, y=300)
        Label(details_frame, text=f'({self.individual_price}*{self.purchase_qty})', font=("Courier", 18),
              foreground="DarkGoldenrod4", bg="PeachPuff2").place(x=269, y=340)

        # Buttons for actions
        Button(details_frame, text="ADD ANOTHER", bg="RoyalBlue2", font=("Courier", 20), foreground="thistle2",
               command=lambda: master.switchFrame(Menu)).place(x=20, y=400)
        Button(details_frame, text="PROCEED AND PAY", bg="dark green", font=("Courier", 20), foreground="thistle2",
               command=lambda: master.switchFrame(Receipt)).place(x=250, y=400)
        Button(details_frame, text="CANCEL", font=("Courier", 20), bg="OrangeRed3", command=Cancel,
               foreground="thistle2").place(x=550, y=400)


class Receipt(Frame):
    """
         Class Frame for Receipt

        This function will display the receipt and prompt the user:
        1) Add Another
        2) Proceed and Pay
        3) Cancel

    """

    # initialise constructor
    def __init__(self, master):
        global TotalPrice
        # calls constructor from the superclass
        Frame.__init__(self, master)

        # resize the window
        self.master.geometry("900x700+325+25")

        # Frame to store all the widgets
        window_Frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_Frame.pack(side=tk.TOP)

        # Frame to store the details
        details_Frame = Frame(window_Frame, width=700, height=650, highlightthickness="5", bg="PeachPuff2")
        details_Frame.place(x=100, y=25)

        # Display the Product id
        Label(details_Frame, text="Product", font=("Courier", 20), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=30, y=85)
        Label(details_Frame, text=" ID ", font=("Courier", 18), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=40, y=120)

        # Frame to display the price per product
        Label(details_Frame, text="Individual", font=("Courier", 20), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=220, y=85)
        Label(details_Frame, text=" Price ", font=("Courier", 18), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=260, y=120)

        # Frame to display the name of that product #
        Label(details_Frame, text="Name", font=("Courier", 20), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=415, y=85)

        # Frame to display the total price of that product
        Label(details_Frame, text="Total Price", font=("Courier", 20), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=490, y=85)
        Label(details_Frame, text="Per Product", font=("Courier", 18), foreground="DarkGoldenrod4",
              bg="PeachPuff2").place(x=505, y=120)

        # open the .csv in read mode
        with open('transactions.csv', 'r') as order_readfile:
            # append the content of order_readfile to order_list
            order_content = csv.reader(order_readfile)
            order_list = list(order_content)

            yAxis = 153  # starting yAxis
            TotalPrice = 0  # total price of the whole order
            for row in order_list:
                Label(details_Frame, text=row[0], font=("Courier", 18), bg="PeachPuff2").place(x=35, y=yAxis)
                Label(details_Frame, text=row[2], font=("Courier", 18), bg="PeachPuff2").place(x=282, y=yAxis)
                Label(details_Frame, text=row[1], font=("Courier", 18), bg="PeachPuff2").place(x=435, y=yAxis)
                TotalPricePerProduct = float(row[2]) * float(row[3])
                TotalPrice += TotalPricePerProduct  # calculate the total price of the order
                Label(details_Frame, text=TotalPricePerProduct, font=("Courier", 18), bg="PeachPuff2").place(x=550,
                                                                                                             y=yAxis)
                yAxis += 40

            Label(self, text="-----------", font="Courier", foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=625, y=528)
            Label(self, text=f"Total Price: Rs {TotalPrice}", font=("Courier", 20), bg="PeachPuff2").place(x=420, y=550)
            Label(self, text="-----------", font="Courier", foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=625, y=578)

            # Button for user to go back
            Button(details_Frame, text="Back", font=("Courier", 20), bg="RoyalBlue2", width=10,
                   command=lambda: master.switchFrame(ProductDetails, IndividualID, productName, IndividualPrice, OrderProductQty), foreground="thistle2").place(x=130, y=580)
            # Button for user to proceed to payment method
            Button(details_Frame, text="Payment", font=("Courier", 20), bg="dark green", width=10,
                   command=lambda: master.switchFrame(Payment), foreground="thistle2").place(x=370, y=580)


class Payment(Frame):

    """
        Class Frame for Payment

        This function will display the payment methods (Cash or Card) and prompt the user to enter:
        --> Credit Card details
        or
        --> Cash Payment details
    """
    global messagecode
    messagecode = 0

    # initialise constructor
    def __init__(self, master):
        # calls constructor from the superclass
        Frame.__init__(self, master)

        # resize the window
        self.master.geometry("900x700+325+25")

        # function for cash payment

        def CASH():
            """
            This function will carry out the following operations:
            1) enable the user to enter the amount of money
            2) Validate the amount
            3) Proceed to next window
            """
            global amount
            amount = 0

            # Button to choose cash
            Button(Payment_Method, text="CASH", font=("Courier", 20), bg="AntiqueWhite4",
                   command=CASH, foreground="thistle2").place(x=150, y=20)
            # Button to choose card
            Button(Payment_Method, text="CARD", font=("Courier", 20), bg="AntiqueWhite4",
                   command=CARD, foreground="thistle2").place(x=450, y=20)

            # clear all widget in that specific frame
            for widgets in Payment_Details.winfo_children():
                widgets.destroy()

            Finish_Button["state"] = "disable"

            # a list to store the notes/coin the user will insert
            money_list = ["2000", "1000", "500", "200", "100",
                          "50", "25", "10", "5", "1",
                          "CE"]

            # function to clear everything on the display
            def ce():
                """
                This function will carry out the following operations:
                1) will clear whatever has been displayed on the display
                2) will set the total amount to zero
                """
                global amount
                amount = 0
                # display the change
                text = f"Rs 0"
                Change_Label.config(text=text)
                input_text.set(str(amount))
                Finish_Button["state"] = "disable"

            # function to calculate the total amount of notes/coin clicked
            def button_click(item):
                """
                This function will do the following operations:
                1) Calculate the total amount
                2) Display it on the display
                3) Calculate the change
                4) check if the change is negative
                5) If -ve, then display an error and also make the finish button disable
                6) else, display the change and set the finish button to normal
                :param item: string
                :return: nothing
                """
                global amount
                global change
                amount += int(item)
                input_text.set(str(amount))
                # calculate the change
                change = amount - TotalPrice
                # check if there is lack of money inserted
                if change < 0:
                    Finish_Button["state"] = "disable"
                else:
                    # display the change
                    text = f"Rs {change}"
                    Change_Label.config(text=text)
                    Finish_Button["state"] = "normal"

            # variable to store the amount entered by the user
            input_text = StringVar()
            input_text.set(str(amount))  # display the amount

            Label(Payment_Details, text="Cash due:", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=75, y=10, height=25)

            Label(Payment_Details, text=f'Rs {TotalPrice}', font=("Courier", 25), bg="PeachPuff2").place(x=347, y=10,
                                                                                                         height=25)

            Label(Payment_Details, text="Cash entered: ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=75, y=80, height=25)

            Label(Payment_Details, text=f"Your change:", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=75, y=150)

            Change_Label = Label(Payment_Details, text='Rs 0', font=("Courier", 25), bg="PeachPuff2")
            Change_Label.place(x=347, y=150)

            Label(Payment_Details, text="Enter your cash ", font=("Courier", 15), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=50, y=220, height=25)

            # generate the display bar
            screen = Entry(Payment_Details, font=("Courier", 23), textvariable=input_text, bg="light grey", bd=8,
                           width=5,
                           justify=CENTER)
            screen.place(x=355, y=70)

            i = 0  # starting index for money_list
            # loop to display the money button in Payment_Details frame
            for row in range(250, 330, 60):
                for column in range(75, 575, 100):
                    Button(Payment_Details, text=money_list[i], font=("Courier", 20), bg="AntiqueWhite4", width=5,
                           foreground="black", command=lambda name=money_list[i]: button_click(name)).place(
                        x=column, y=row)
                    i += 1  # increment the index

            # Button to clear everything on the display
            Button(Payment_Details, text="UNDO", font=("Courier", 20), bg="OrangeRed3", foreground="thistle2", width=12,
                   command=lambda: ce()).place(x=225, y=380)

        def CARD():
            Finish_Button["state"] = "disable"
            # Button to choose cash
            Button(Payment_Method, text="CASH", font=("Courier", 20), bg="AntiqueWhite4",
                   command=CASH, foreground="thistle2").place(x=150, y=20)
            # Button to choose card
            Button(Payment_Method, text="CARD", font=("Courier", 20), bg="AntiqueWhite4",
                   command=CARD, foreground="thistle2").place(x=450, y=20)
            """
            This function will prompt the user for the following details:
            1) Name
            2) Account Number
            3) CVV
            4) Valid Thru
            """

            def validate():
                if len(name.get()) == 0 or len(account_number.get()) == 0 or len(cvv.get()) == 0 or \
                        len(month.get()) == 0 or len(year.get()) == 0:
                    Finish_Button["state"] = 'disabled'
                else:
                    Finish_Button["state"] = 'normal'

            # clear all widget in that specific frame
            for widgets in Payment_Details.winfo_children():
                widgets.destroy()
            # Label and entry for user to enter bank details
            Label(Payment_Details, text="Name ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=70, y=50, height=25)
            name = Entry(Payment_Details, width=25, bg="AntiqueWhite3", font=("Courier", 15))
            name.place(x=220, y=50, height=25)

            Label(Payment_Details, text="Account ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=50, y=115, height=25)
            Label(Payment_Details, text=" Number ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=40, y=143, height=25)
            account_number = Entry(Payment_Details, width=20, bg="AntiqueWhite3", font=("Courier", 15))
            account_number.place(x=220, y=129, height=25)

            Label(Payment_Details, text="CVV ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=70, y=208, height=25)
            cvv = Entry(Payment_Details, width=3, bg="AntiqueWhite3", font=("Courier", 15))
            cvv.place(x=220, y=208, height=25)

            Label(Payment_Details, text="VALID  ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=53, y=273, height=25)
            Label(Payment_Details, text=" THRU ", font=("Courier", 25), foreground="DarkGoldenrod4",
                  bg="PeachPuff2").place(x=43, y=301, height=25)
            month = Entry(Payment_Details, width=2, bg="AntiqueWhite3", font=("Courier", 15))
            month.place(x=220, y=287, height=25)
            Label(Payment_Details, text='/', font=("Courier", 20, 'bold'), bg='PeachPuff2', fg='sienna4').place(
                x=252, y=280)
            year = Entry(Payment_Details, width=2, bg="AntiqueWhite3", font=("Courier", 15))
            year.place(x=275, y=287, height=25)

            # Button to validate correct entry
            Button(Payment_Details, text="VALIDATE", font=("Courier", 20), bg="AntiqueWhite4", foreground="black",
                   command=lambda: validate()).place(x=250, y=350)

        # Frame to store all the widgets
        window_Frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_Frame.pack(side=tk.TOP)

        # Frame to display the payment method
        Payment_Method = Frame(window_Frame, width=900, height=100, bg="NavajoWhite4")
        Payment_Method.place(x=100, y=0)

        # Frame to display cash change or bank details
        Payment_Details = Frame(window_Frame, width=650, height=525, highlightthickness="5", bg="PeachPuff2")
        Payment_Details.place(x=125, y=100)

        # Label to indicate the user to choose cash or bank
        Label(Payment_Details, text="Please Choose ", font=("Courier", 50), bg="PeachPuff2").place(x=50, y=50)
        Label(Payment_Details, text=" A Button ", font=("Courier", 50), bg="PeachPuff2").place(x=120, y=120)
        Label(Payment_Details, text=" Below", font=("Courier", 50), bg="PeachPuff2").place(x=180, y=190)

        # Button to choose cash
        Button(Payment_Details, text="CASH", font=("Courier", 20), bg="AntiqueWhite4",
               command=CASH, foreground="thistle2").place(x=130, y=290)
        # Button to choose card
        Button(Payment_Details, text="CARD", font=("Courier", 20), bg="AntiqueWhite4",
               command=CARD, foreground="thistle2").place(x=430, y=290)

        # Finish Payment button
        Finish_Button = Button(window_Frame, text="Finish", font=("Courier", 20), bg="AntiqueWhite4",
                               command=lambda: master.switchFrame(Message), foreground="thistle2")
        Finish_Button.place(x=400, y=630)
        Finish_Button["state"] = "disable"
        # Empty the transaction.csv file
        with open("transactions.csv", "w") as category_file:
            category_file.truncate(0)

class Message(Frame):
    """
        Class Frame for Goodbye message
        This function will display the goodbye message and close the application.
    """

    # initialise constructor
    def __init__(self, master):
        # calls constructor from the superclass
        Frame.__init__(self, master)

        # resize the window
        self.master.geometry("900x700+325+25")

        MS_DELAY = 500  # Milliseconds between updates.
        timer_text = StringVar()

        def timer_function():
            """
            This function will switch the frame with a pre-determined time limit
            """
            global timer
            timer -= 1
            if timer <= 1:
                self.after(1000, lambda: master.switchFrame(Welcome))
            return timer

        def print_timer():
            """
            This function will display the remaining seconds to switch automatically to the welcome window
            """
            timer_text.set(f'Returning in {timer_function()} secs')
            details_Frame.after(MS_DELAY, print_timer)  # Schedule next check.

        # Frame to store all the widgets
        window_Frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_Frame.pack(side=tk.TOP)

        # Frame to store the details
        details_Frame = Frame(window_Frame, width=700, height=500, highlightthickness="5", bg="PeachPuff2")
        details_Frame.place(x=100, y=100)

        if messagecode == 1:
            # Cancel Message
            Label(details_Frame, text="Sorry,", font=("Courier", 25), bg="PeachPuff2").place(x=300, y=50)
            Label(details_Frame, text="We could not provide you with ", font=("Courier", 20),
                  bg="PeachPuff2").place(x=120, y=100)
            Label(details_Frame, text=" what you would like today.", font=("Courier", 22),
                  bg="PeachPuff2").place(x=180, y=140)
            Label(details_Frame, text="We hope to be seeing you again soon. ", font=("Courier", 20),
                  bg="PeachPuff2").place(x=120, y=200)
            Label(details_Frame, text=" Wish you a Good day!", font=("Courier", 22), bg="PeachPuff2").place(x=205, y=250)
            Redirecting_Label = Label(details_Frame, textvariable=timer_text, font=("Courier", 20), bg="PeachPuff2")
            Redirecting_Label.place(x=205, y=350)
            details_Frame.after(MS_DELAY, print_timer)

        else:
            # GoodBye Message
            Label(details_Frame, text="Thank You", font=("Courier", 50), bg="PeachPuff2").place(x=140, y=50)
            Label(details_Frame, text=" Good-Bye ", font=("Courier", 44), bg="PeachPuff2").place(x=160, y=130)
            Label(details_Frame, text="Hope to see", font=("Courier", 44), bg="PeachPuff2").place(x=100, y=225)
            Label(details_Frame, text=" you soon", font=("Courier", 44), bg="PeachPuff2").place(x=210, y=300)
            Redirecting_Label = Label(details_Frame, textvariable=timer_text, font=("Courier", 20), bg="PeachPuff2")
            Redirecting_Label.place(x=195, y=380)
            details_Frame.after(MS_DELAY, print_timer)


# Example usage within an application
class Application(tk.Tk):
    """
           App Class
           Tk: Toplevel widget of Tk which represents mostly the main window of an application.
               It has an associated Tcl interpreter
           This class will:
           1) Create a frame
           2) Format the frame
           3) Allow to switch frame by destroying the previous used frame
    """
    def __init__(self):
        super().__init__()
        self.title("Product Details")
        self.geometry("900x700+325+25")
        self.frames = {}
        self.show_frame(Welcome)

    def show_frame(self, cont, *args):   # cont: Represents a class or function that creates a frame. *args: A variable-length argument list that allows passing an arbitrary number of arguments to the cont class or function.
        frame = self.frames.get(cont)
        if frame is None:
            frame = cont(self, *args)
            self.frames[cont] = frame
        frame.place(relwidth=1, relheight=1)
        frame.tkraise()

    def switchFrame(self, cont, *args):
        self.show_frame(cont, *args)


class Menu(Frame):
    def show_frame(self, frame_class, *args):
        new_frame = frame_class(self.master, *args)
        new_frame.pack(fill="both", expand=True)
        self.pack_forget()

    def __init__(self, master):
        Frame.__init__(self, master)
        self.master.geometry("900x700+325+25")
        self.master = master

        # Set up database connection
        self.db = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='aisharamjaun',
            database='vendingmachine'
        )
        self.cursor = self.db.cursor()

        # Variable to store the selected product ID
        self.selected_product_id = IntVar()
        self.selected_product_id.set(0)  # Initialize with a default value

        # Frame to store all the widgets
        window_Frame = Frame(self, width=900, height=700, bg="NavajoWhite4")
        window_Frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Frame to store the details
        details_Frame = Frame(window_Frame, width=830, height=650, highlightthickness="5", bg="PeachPuff2")
        details_Frame.place(x=35, y=25)

        # Frame for the pie chart (top-right corner)
        pieChart_Frame = Frame(window_Frame, width=200, height=200, bg="PeachPuff2")
        pieChart_Frame.place(x=500, y=25)

        # Call the method to extract and display product details
        self.extract(details_Frame)

        # Fetch data and display pie chart
        names, quantities = self.fetch_data_from_db()
        if names and quantities:
            self.display_pie_chart(pieChart_Frame, quantities, names)
        else:
            Label(pieChart_Frame, text="No data available", font=("Arial", 16)).pack(pady=20)

    def extract(self, parent_frame):
        # Frame for product details
        products_Frame = Frame(parent_frame, bg="PeachPuff2")
        products_Frame.pack(pady=10)

        # Fetch product details
        self.cursor.execute("SELECT product_id, name, image_path FROM products")
        products = self.cursor.fetchall()

        # Process and display products
        self.display_product_details(products, products_Frame)

    def fetch_data_from_db(self):
        try:
            # Fetch product details
            self.cursor.execute("SELECT name, quantity FROM products")
            products = self.cursor.fetchall()

            # Extract names and quantities
            names = [product[0] for product in products]
            quantities = [product[1] for product in products]

            return names, quantities

        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return [], []

    def realValue_format(self, values):
        def my_format(pct):
            total = sum(values)
            val = int(round(pct * total / 100.0))
            return '{v:d}'.format(v=val)

        return my_format

    def display_pie_chart(self, frame, quantities, names):
        fig = Figure(figsize=(4, 4), dpi=70)  # Adjusted size
        fig.patch.set_facecolor('#f0cbab')

        ax = fig.add_subplot(111)  # the subplot is a 1x1 grid, and this is the first subplot.
        ax.pie(quantities, radius=0.8, labels=names, autopct=self.realValue_format(quantities), startangle=270)
        ax.set_title('Product Stock Level', fontdict={'fontsize': 10}, x=0.5, y=0.95)

        '''
        autopct: A function to format the values displayed on the pie chart. 
        self.realValue_format(quantities) is a method from the class that formats the percentage values.
        startangle: The angle by which the start of the pie chart is rotated. Setting it to 270 makes the pie start from the top.
        '''

        chart = FigureCanvasTkAgg(fig, frame)
        chart.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        '''
        chart.get_tk_widget(): Retrieves the Tkinter widget that contains the figure.
        pack(fill=tk.BOTH, expand=True): Packs the widget into the Tkinter frame, 
        allowing it to fill the entire frame and expand as necessary.
        '''

    def display_product_details(self, products, parent_frame):
        # Define grid parameters
        num_columns = 2
        num_rows = 4  # Fixed number of rows
        image_width, image_height = 150, 150  # Adjust these dimensions if necessary
        padding = 10  # Padding between images

        # Calculate the required size for the parent_frame
        parent_frame_width = num_columns * (image_width + padding) + padding
        parent_frame_height = num_rows * (image_height + padding) + padding

        # Resize the parent_frame to fit all images
        parent_frame.config(width=parent_frame_width, height=parent_frame_height)

        # Create an image reference list
        parent_frame.image_refs = []

        for index, (prod_id, prod_name, img_path) in enumerate(products):
            if index >= num_columns * num_rows:  # Limit to num_columns * num_rows products
                break

            # Calculate the row and column for this image
            row = index // num_columns
            col = index % num_columns

            # Calculate the position for this image
            x = col * (image_width + padding) + padding
            y = row * (image_height + padding) + padding

            # Display product ID
            Label(parent_frame, text=f"ID: {prod_id}", font=("Courier", 12), bg="PeachPuff2").place(x=x, y=y - 17)

            # Display product name
            Label(parent_frame, text=prod_name, font=("Courier", 12), bg="PeachPuff2").place(x=x,
                                                                                             y=y + image_height + 5)

            # Check if image path is valid
            if os.path.isfile(img_path):
                # Load and display product image
                try:
                    img = Image.open(img_path)  # Open image file
                    img = img.resize((150, 150), Image.LANCZOS)  # Resize image
                    img_tk = ImageTk.PhotoImage(img)
                    image_label = Label(parent_frame, image=img_tk)
                    image_label.place(x=x, y=y)
                    # Bind click event to image
                    image_label.bind("<Button-1>", lambda event, pid=prod_id: self.update_selected_product_id(pid))
                    # Keep a reference to avoid garbage collection
                    parent_frame.image_refs.append(img_tk)
                except Exception as e:
                    print(f"Error loading image {img_path}: {e}")
            else:
                print(f"Image file not found: {img_path}")

    def update_selected_product_id(self, product_id):
        self.selected_product_id.set(product_id)
        print(f"Selected Product ID: {self.selected_product_id.get()}")
        # Call show_details with the selected product ID
        show_details(product_id, self)


def show_details(product_id, menu_instance):
    """
    This function takes a product_id as an argument.
    :param product_id: int
    :param menu_instance: instance of the menu
    :return: nothing
    """
    details = fetch_product_details(product_id)

    if not details:
        print("Product not found!")
        return

    # Clear existing details frame if it exists
    if hasattr(menu_instance, 'details_frame'):
        menu_instance.details_frame.destroy()

    # Create a new frame to display details
    details_frame = Frame(menu_instance, width=400, height=290, bg="PeachPuff2", highlightthickness="3")
    details_frame.place(x=420, y=350)

    # Global variables for future reference
    global IndividualID, stockQty, IndividualPrice, productName, OrderProductQty

    OrderProductQty = 0
    IndividualPrice = details[2]
    IndividualID = details[0]

    def increase():
        global OrderProductQty
        if OrderProductQty < 10:
            OrderProductQty += 1
            TEXT = f"Quantity: {OrderProductQty}"
            Qty.config(text=TEXT)
            Next_Button['state'] = 'normal'

    def decrease():
        global OrderProductQty
        if OrderProductQty > 0:
            OrderProductQty -= 1
            TEXT = f"Quantity: {OrderProductQty}"
            Qty.config(text=TEXT)
        if OrderProductQty <= 0:
            Next_Button['state'] = 'disable'

    productID = "ID: " + str(details[0])
    productName = details[1]
    productPrice = "Price: Rs " + str(details[2])
    stockQty = details[3]

    # Delete old widgets
    for details_widget in details_frame.winfo_children():
        details_widget.destroy()

    # Display the Name, productID, and price
    if len(productName) >= 15:
        shorten_Text = productName[0:12] + "..."
        Label(details_frame, text=shorten_Text, font=("courier", 22), bg="PeachPuff2").place(x=100, y=0)
    else:
        Label(details_frame, text=productName, font=("courier", 22), bg="PeachPuff2").place(x=100, y=0)

    Label(details_frame, text=productID, font=("courier", 17), bg="PeachPuff2").place(x=10, y=50)
    Label(details_frame, text=productPrice, font=('courier', 15), bg="PeachPuff2").place(x=10, y=100)
    Qty = Label(details_frame, text=f"Quantity: 0", font=("courier", 12), bg="PeachPuff2")
    Qty.place(x=10, y=150)

    Button(details_frame, text="+", font="Courier", width=2, height=1, bg='PeachPuff2', command=increase).place(
        x=140, y=130)
    Button(details_frame, text="-", font="Courier", width=2, height=1, bg="PeachPuff2", command=decrease).place(
        x=140, y=170)

    # Find the picture path in the details
    picture_path = details[4]
    if os.path.isfile(picture_path):
        # Open the image according to the picture_path
        iimmgg = Image.open(picture_path)
        img = ImageTk.PhotoImage(iimmgg)
        # Display the image
        picture_Label = Label(details_frame, image=img)
        picture_Label.image = img
        picture_Label.place(x=200, y=45)

    Next_Button = Button(details_frame, text="NEXT", font="Courier", width=10, height=2, bg="NavajoWhite4",
                         command=lambda: NEXT(menu_instance))
    Next_Button.place(x=140, y=225)
    Next_Button['state'] = 'disable'

    # Store the new details_frame in the instance for future reference
    menu_instance.details_frame = details_frame


def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="aisharamjaun",
        database="vendingmachine"
    )


def fetch_product_details(product_id):
    db = connect_to_db()
    cursor = db.cursor()
    query = "SELECT * FROM products WHERE product_id = %s"
    cursor.execute(query, (product_id,))
    result = cursor.fetchone()
    db.close()
    return result


def NEXT(menu_instance):
    global OrderProductQty, stockQty, IndividualID, productName, IndividualPrice

    # Check if order quantity is greater than stock quantity
    if OrderProductQty > stockQty:
        messagebox.showerror("Error", "Order quantity exceeds available stock!")
        return

    # Append transaction to transactions.csv
    with open('transactions.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(
            [IndividualID, productName, IndividualPrice, OrderProductQty, IndividualPrice * OrderProductQty])

    # Update available stock in available_stock.txt
    updated_stock = []
    with open('available_stock.txt', mode='r') as file:
        reader = csv.reader(file)
        header = next(reader)  # Skip header row
        updated_stock.append(header)  # Add header back to the updated stock list
        for row in reader:
            if int(row[0]) == IndividualID:
                new_quantity = int(row[2]) - OrderProductQty
                updated_stock.append([row[0], row[1], new_quantity])
            else:
                updated_stock.append(row)

    with open('available_stock.txt', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(updated_stock)

    # Update client with the currently available stock
    for row in updated_stock:
        if row[0] != 'id':  # Skip the header row
            product_id = int(row[0])
            product_name = row[1]
            product_quantity = int(row[2])
            print(f"Product ID: {product_id}, Name: {product_name}, Available Quantity: {product_quantity}")

    # Switch to ProductDetails frame
    menu_instance.show_frame(ProductDetails, IndividualID, productName, IndividualPrice, OrderProductQty)


if __name__ == "__main__":
    app = Application()
    app.mainloop()

