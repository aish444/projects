import tkinter as tk
from tkinter import Frame, Label
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import pandas as pd

class VendingMachineApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Vending Machine")
        self.root.geometry("800x600")
        self.create_widgets()

    def create_widgets(self):
        window_Frame = Frame(self.root, bg="PeachPuff2")
        window_Frame.pack(fill=tk.BOTH, expand=True)

        # Frame for the pie chart (top-right corner)
        pieChart_Frame = Frame(window_Frame, width=200, height=200, bg="PeachPuff2")
        pieChart_Frame.place(x=500, y=25)



        # Fetch data and display pie chart
        names, quantities = self.fetch_data_from_file()
        if names and quantities:
            self.display_pie_chart(pieChart_Frame, quantities, names)
        else:
            Label(pieChart_Frame, text="No data available", font=("Arial", 16)).pack(pady=20)

    def fetch_data_from_file(self):
        try:
            # Read product details from file
            data = pd.read_csv('available_stock.txt')

            # Extract names and quantities
            names = data['name'].tolist()
            quantities = data['quantity'].tolist()

            return names, quantities

        except Exception as err:
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

        ax = fig.add_subplot(111)
        ax.pie(quantities, radius=0.8, labels=names, autopct=self.realValue_format(quantities), startangle=270)
        ax.set_title('Product Stock Level', fontdict={'fontsize': 10}, x=0.5, y=0.95)

        chart = FigureCanvasTkAgg(fig, frame)
        chart.get_tk_widget().pack(fill=tk.BOTH, expand=True)








if __name__ == "__main__":
    root = tk.Tk()
    app = VendingMachineApp(root)
    root.mainloop()
