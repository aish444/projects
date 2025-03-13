import pygame
import sys
import time
import math
import cv2
import textwrap
import json 
import random

# Initialize Pygame
pygame.init()

# Initialize the mixer
pygame.mixer.init()

# Load translations from JSON file
with open('translation.json', 'r', encoding='utf-8') as file:
    translations = json.load(file)

# Set the default language
current_language = 'ENGLISH'

# Function to get the translated text
def get_translation(key):
    return translations[current_language].get(key, key)

# Constants
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800
FPS = 60  # Frame rate per second
gradient_shift = 0  # Gradient shift variable


RED = (255, 0, 0) #the hover color
Pale_Purple = (204, 153, 255)
Dark_Purple = (48, 25, 52)
Pale_Blue = (173, 216, 230)
BG_COLOR = (50, 50, 50)
BAR_COLOR = (0, 0, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (200, 200, 200)
PACMAN_COLOR = (255, 255, 0)
DOT_COLOR = (255, 255, 255)
DOT_RADIUS = 5
LOADING_TIME = 4.5  # seconds

# Load background image
background_image = pygame.image.load("PACMAN BY BRG.png")  # Load the "PACMAN BY GAG" image
background_image = pygame.transform.scale(background_image, (SCREEN_WIDTH, SCREEN_HEIGHT))

# Load intro sound
intro_sound = pygame.mixer.Sound("Intro.mp3")  # Load your sound file

# Screen setup
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Loading Screen')

# Loading bar dimensions
BAR_WIDTH = SCREEN_WIDTH - 100
BAR_HEIGHT = 50
BAR_X = (SCREEN_WIDTH - BAR_WIDTH) // 2
BAR_Y = SCREEN_HEIGHT - BAR_HEIGHT - 20  # Position at the bottom with a 20-pixel margin

# Pac-Man dimensions
PACMAN_RADIUS = BAR_HEIGHT // 2
PACMAN_START_X = BAR_X
PACMAN_Y = BAR_Y + BAR_HEIGHT // 2

# Dot positions
NUM_DOTS = 10
DOT_SPACING = (BAR_WIDTH - PACMAN_RADIUS * 2) // NUM_DOTS
DOTS_X = [BAR_X + PACMAN_RADIUS + i * DOT_SPACING for i in range(NUM_DOTS)]
dots_eaten = [False] * NUM_DOTS  # Track which dots are eaten

# Function to draw Pac-Man
def draw_pacman(x, y, mouth_angle):
    """Draws Pac-Man facing right with a dynamic mouth opening."""
    pygame.draw.circle(screen, PACMAN_COLOR, (x, y), PACMAN_RADIUS)
    # Calculate mouth points
    start_angle = mouth_angle  # Starting angle for the mouth
    end_angle = -mouth_angle  # Ending angle for the mouth
    points = [
        (x, y),  # Center of the Pac-Man
        (x + PACMAN_RADIUS * math.cos(math.radians(start_angle)), y - PACMAN_RADIUS * math.sin(math.radians(start_angle))),  # Point on circle's edge
        (x + PACMAN_RADIUS * math.cos(math.radians(end_angle)), y - PACMAN_RADIUS * math.sin(math.radians(end_angle))),  # Another point on the circle's edge
    ]
    pygame.draw.polygon(screen, BG_COLOR, points)

# Function to draw dots
def draw_dots():
    for i, dot_x in enumerate(DOTS_X):
        if not dots_eaten[i]:  # Only draw the dot if it hasn't been eaten
            pygame.draw.circle(screen, DOT_COLOR, (dot_x, PACMAN_Y), DOT_RADIUS)

# Function to check if Pac-Man eats a dot
def check_eating(pacman_x):
    global dots_eaten
    for i, dot_x in enumerate(DOTS_X):
        if not dots_eaten[i] and pacman_x >= dot_x - PACMAN_RADIUS and pacman_x <= dot_x + DOT_RADIUS:
            dots_eaten[i] = True

# Main loop
start_time = time.time()
running = True

# Play the intro sound
intro_sound.play()

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Draw the background image
    screen.blit(background_image, (0, 0))

    # Draw loading bar
    pygame.draw.rect(screen, BAR_COLOR, (BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT), 3)
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    if elapsed_time > LOADING_TIME:
        elapsed_time = LOADING_TIME

    # Calculate Pac-Man position
    progress = elapsed_time / LOADING_TIME
    pacman_x = PACMAN_START_X + int(progress * (BAR_WIDTH - PACMAN_RADIUS * 2))
    
    # Check if Pac-Man eats a dot
    check_eating(pacman_x)
    
    # Draw dots and Pac-Man
    draw_dots()
    mouth_angle = 30 * math.sin(progress * 4 * math.pi)  # Open and close mouth smoothly
    draw_pacman(pacman_x, PACMAN_Y, mouth_angle)
    
    pygame.display.flip()

    # Check if loading is complete
    if elapsed_time >= LOADING_TIME:
        running = False

    # Cap the frame rate
    pygame.time.Clock().tick(60)

# Set up display
screen = pygame.display.set_mode([SCREEN_WIDTH, SCREEN_HEIGHT])
pygame.display.set_caption('MAIN MENU')


background_image = pygame.image.load('menu.jpg')
background_image = pygame.transform.scale(background_image, (SCREEN_WIDTH, SCREEN_HEIGHT))

select_sound = pygame.mixer.Sound('selection.mp3')
all_sounds = [select_sound]


# Font setup
font_main = pygame.font.Font('Playground.ttf', 50)  # Main menu font
font_option = pygame.font.Font('Playground.ttf', 36)  # Option buttons font
font_loading = pygame.font.Font('Playground.ttf', 48)  # Loading screen font

# Clock to control the frame rate
clock = pygame.time.Clock()

# Main loop control
is_running = True
in_settings = False
in_customize = False  # Variable to track if we're in the Customize menu
sound_on = True

# Loading animation setup
loading_angle = 0
t = 0  # Time variable for color cycling

# Function to create a smooth color transition using sine waves
def get_color(t):
    r = int((math.sin(t) + 1) * 127.5)
    g = int((math.sin(t + 2 * math.pi / 3) + 1) * 127.5)
    b = int((math.sin(t + 4 * math.pi / 3) + 1) * 127.5)
    return (r, g, b)

# Function to draw text
def draw_text(text, font, color, surface, x, y):
    textobj = font.render(text, True, color)
    textrect = textobj.get_rect(center=(x, y))
    surface.blit(textobj, textrect)

# Function to display loading screen
def display_loading_screen():
    global loading_angle
    start_time = time.time()
    while time.time() - start_time < 3:
        screen.blit(background_image, (0, 0))  # Draw the background image
        draw_text(get_translation("Exiting the game!"), font_loading, (255, 255, 255), screen, SCREEN_WIDTH // 2, 150)

        # Draw animated loading icon (rotating circle)
        loading_radius = 30
        num_dots = 12
        center_x = SCREEN_WIDTH // 2
        center_y = 350
        for i in range(num_dots):
            angle = (loading_angle + i * (360 / num_dots)) * math.pi / 180
            x = center_x + math.cos(angle) * loading_radius
            y = center_y + math.sin(angle) * loading_radius
            color = (255, 255, 0) if i == 0 else (255, 255, 255)
            pygame.draw.circle(screen, color, (int(x), int(y)), 5)

        loading_angle = (loading_angle + 6) % 360  # Rotate by 6 degrees
        pygame.display.update()
        pygame.time.delay(100)  # Control the speed of animation

# Function to display the main menu
def display_main_menu():
    global t
    t += 0.01  # Increment time variable for color animation
    dynamic_color = get_color(t)  # Get dynamic colors

    screen.blit(background_image, (0, 0))  # Draw background image
    draw_text((get_translation('MAIN MENU')), font_main, (255, 255, 255), screen, SCREEN_WIDTH / 2, 150)

    mouse_pos = pygame.mouse.get_pos()  # Get mouse position

    # Draw buttons and check for hover
    buttons = [
        (start_button_rect, get_translation('START'), 275),
        (scoreboard_button_rect, get_translation('SCOREBOARD'), 345),
        (settings_button_rect, get_translation('SETTINGS'), 415),
        (quit_button_rect, get_translation('QUIT'), 485)
    ]

    for rect, text, y in buttons:
        if rect.collidepoint(mouse_pos):
            draw_text(text, font_option, (255, 0, 0), screen, SCREEN_WIDTH / 2, y)
        else:
            draw_text(text, font_option, dynamic_color, screen, SCREEN_WIDTH / 2, y)

# Function to update volume settings
def update_volume():
    if sound_on:
        pygame.mixer.music.set_volume(1)
        for sound in all_sounds:
            sound.set_volume(1)
    else:
        pygame.mixer.music.set_volume(0)
        for sound in all_sounds:
            sound.set_volume(0)

# Function to display the settings menu
def display_settings_menu():
    global t
    t += 0.01  # Increment time variable for color animation
    dynamic_color = get_color(t)  # Get dynamic colors
    
    global sound_on

    screen.blit(background_image, (0, 0))  # Draw background image
    draw_text(get_translation('SETTINGS'), font_main, (255, 255, 255), screen, SCREEN_WIDTH / 2, 150)

    mouse_pos = pygame.mouse.get_pos()  # Get mouse position

    # Draw checkboxes for sound settings
    checkbox_rect_on = pygame.Rect(700, 255, 50, 40)
    checkbox_rect_off = pygame.Rect(750, 255, 80, 40)

    if sound_on:
        pygame.draw.rect(screen, dynamic_color, checkbox_rect_on, 2)  # Outline
    else:
        pygame.draw.rect(screen, dynamic_color, checkbox_rect_off, 2)  # Outline

    draw_text('On', font_option, dynamic_color, screen, 725, 275)
    draw_text('Off', font_option, dynamic_color, screen, 790, 275)

    if checkbox_rect_on.collidepoint(mouse_pos):
        if pygame.mouse.get_pressed()[0]:  # Left click
            sound_on = True
            update_volume()
    elif checkbox_rect_off.collidepoint(mouse_pos):
        if pygame.mouse.get_pressed()[0]:  # Left click
            sound_on = False
            update_volume()

    # Draw buttons and check for hover
    buttons = [
        (sound_button_rect, get_translation('SOUND :'), 275),
        (customise_button_rect, get_translation('CUSTOMISE') , 345),
        (how_to_play_button_rect, get_translation('HOW TO PLAY'), 415),
        (language_button_rect, get_translation('LANGUAGE'), 485),
        (back_button_rect, get_translation('BACK'), 555)
    ]

    for rect, text, y in buttons:
        if rect.collidepoint(mouse_pos):
            draw_text(text, font_option, (255, 0, 0), screen, SCREEN_WIDTH / 2, y)
        else:
            draw_text(text, font_option, dynamic_color, screen, SCREEN_WIDTH / 2, y)


def display_customize_menu():
    global t
    t += 0.01  # Increment time variable for color animation
    dynamic_color = get_color(t)  # Get dynamic colors

    # Draw background image
    screen.blit(background_image, (0, 0))

    # Customize Menu
    draw_text(get_translation('CUSTOMIZE'), font_main, dynamic_color, screen, SCREEN_WIDTH / 2, 150)

    # Get mouse position
    mouse_pos = pygame.mouse.get_pos()

    buttons = [
        (theme_button_rect, get_translation('THEME'), 275),
        (ghost_skin_button_rect, get_translation('GHOST SKIN') , 345),
        (return_button_rect, get_translation('RETURN'), 415),
    ]

    for rect, text, y in buttons:
        if rect.collidepoint(mouse_pos):
            draw_text(text, font_option, (255, 0, 0), screen, SCREEN_WIDTH / 2, y)
        else:
            draw_text(text, font_option, dynamic_color , screen, SCREEN_WIDTH / 2, y)




# Button rects
start_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 250, 200, 50))
scoreboard_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 320, 200, 50))
settings_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 390, 200, 50))
quit_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 460, 200, 50))

sound_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 250, 200, 50))
customise_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 320, 200, 50))
how_to_play_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 390, 200, 50))
language_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 460, 200, 50))
back_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 530, 200, 50))

theme_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 250, 200, 50))
ghost_skin_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 320, 200, 50))
return_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 390, 200, 50))

english_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 250, 200, 50))
french_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 320, 200, 50))
spanish_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 390, 200, 50))
german_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 460, 200, 50))
close_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 600, 200, 50)  

summer_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 250, 200, 50))
winter_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 320, 200, 50))
autumn_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 390, 200, 50))
spring_button_rect = pygame.Rect((SCREEN_WIDTH / 2 - 100, 460, 200, 50))
return_to_settings_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 530, 200, 50)


#########
# Fonts
font = pygame.font.SysFont('timesnewroman', 24)
bold_italic_underlined_font = pygame.font.SysFont('timesnewroman', 24, bold=True, italic=True)
bold_font = pygame.font.SysFont('timesnewroman', 24, bold=True)
bold_italic_underlined_font.set_underline(True)
# Text to display with bold markers
game_text = """
<b>IMPORTANT INSTRUCTIONS !!</b>
<i>Objective of the Game</i>
In Pac-Man, you navigate a maze as the titular character, Pac-Man, with the primary goal of eating all the pellets (small dots) scattered throughout the maze while avoiding capture by the ghosts. Clearing the maze of all pellets advances you to the next level.

<i>Game Controls</i>
Arrow Keys: Use the arrow keys on your keyboard to move Pac-Man up, down, left, or right through the maze.

<i>Game Elements</i>
Pellets: Small dots scattered throughout the maze. Eating all pellets clears the level.
Power Pellets: Larger, flashing dots located at the corners of the maze. Eating these temporarily turns the ghosts blue and makes them vulnerable, allowing Pac-Man to eat them for bonus points.

<i>Ghost Enemies:</i>
Pac-Man's main adversaries are the four ghosts that patrol the maze. Each ghost has a distinct behavior pattern, making the game a strategic challenge. Here’s a breakdown of each ghost’s characteristics:
<b>(1)Blinky (Red Ghost)</b>
Blinky is the fastest ghost and often chases directly after Pac-Man. As you eat more pellets, Blinky speeds up, making him a relentless pursuer.
<b>(2)Pinky (Pink Ghost)</b>
Pinky tries to position itself ahead of Pac-Man by predicting his movements. Pinky will often try to ambush you by cutting you off at intersections.
<b>(3)Inky (Blue Ghost)</b>
Inky's behavior is more complex. It uses a combination of Blinky’s position and Pac-Man’s position to determine its movement, creating unpredictable and tricky patterns.
<b>(4)Clyde (Orange Ghost)</b>
Clyde is less predictable and somewhat random. He will chase Pac-Man when he is far away, but when close, Clyde will wander away to another part of the maze.

<i>Strategies for winning!</i>
Learn the Maze: Familiarize yourself with the layout to make quick, efficient movements.
Use Power Pellets Wisely: Save them for when ghosts are closing in, and then turn the tables to score extra points by eating the blue ghosts.
Stay Ahead of the Ghosts: Use your knowledge of ghost behavior to anticipate their moves and avoid getting cornered.

<i>Winning and Progressing</i>
Level Completion: Clear the maze of all pellets. Each new level increases the game’s difficulty with faster ghost movements.
Points System: Accumulate points by eating pellets, power pellets, and ghosts. Aim for a high score by staying alive as long as possible and clearing multiple levels.

<i>End of the Game</i>
The game ends when Pac-Man loses all his lives by being caught by the ghosts. Try to achieve the highest score possible before this happens!
Enjoy navigating the maze and outsmarting the ghosts in this classic arcade challenge! Happy playing! 

NOTE TO WATCH TUTORIAL: Press "P" key to pause the video and "S" key to stop the video
"""

def instructions_text(surface, text, color, rect, font, bold_italic_underlined_font, aa=True, bkg=None, scroll_offset=0):
    rect = pygame.Rect(rect)
    y = rect.top - scroll_offset
    line_spacing = -2

    # Get the height of the font
    font_height = font.size("Tg")[1]

    # Split the text into paragraphs
    paragraphs = text.split('\n')

    for paragraph in paragraphs:
        if paragraph == '':
            y += font_height  # Add a blank line
            continue

        # Use textwrap to split text into lines that fit the width of the rect
        wrapped_text = textwrap.wrap(paragraph, width=100)

        for line in wrapped_text:
            if y + font_height > rect.bottom:
                break

            if y + font_height >= rect.top:
                # Check for bold markers
                if line.startswith('<i>') and line.endswith('</i>'):
                    line = line[3:-4]  # Remove bold markers
                    current_font = bold_italic_underlined_font
                elif line.startswith('<b>') and line.endswith('</b>'):
                    line = line[3:-4]  # Remove bold markers
                    current_font = bold_font
                else:
                    current_font = font

                # Render the line and blit it to the surface
                if bkg:
                    image = current_font.render(line, True, color, bkg)
                    image.set_colorkey(bkg)
                else:
                    image = current_font.render(line, aa, color)

                surface.blit(image, (rect.left, y))
            y += font_height + line_spacing

    return text

def tutorial() :
    window_size = (SCREEN_WIDTH, SCREEN_HEIGHT)
    screen = pygame.display.set_mode(window_size)

    # Open the video file
    video_path = 'tutorial.mp4'
    cap = cv2.VideoCapture(video_path)

    # Function to convert OpenCV frame to Pygame surface
    def cv2_frame_to_pygame_surface(frame):
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.transpose(frame)
        frame = pygame.surfarray.make_surface(frame)
        return frame

    paused = False
    running = True
    clock = pygame.time.Clock()

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_p:  # Pause the video
                    paused = not paused
                elif event.key == pygame.K_s:  # Stop the video
                    running = False
        
        if not paused:
            ret, frame = cap.read()
            if not ret:
                running = False
                continue
            frame_surface = cv2_frame_to_pygame_surface(frame)
            screen.blit(frame_surface, (0, 0))
        
        pygame.display.flip()
        clock.tick(30)

    cap.release()


def text_displayed():
        running = True
        clock = pygame.time.Clock()
        scroll_offset = 0
        scroll_speed = 10  # Adjust this value to change the scroll speed

        # Text area
        text_rect = pygame.Rect(50, 50, SCREEN_WIDTH - 100, SCREEN_HEIGHT - 200)

        # Back button
        back_button_rect = pygame.Rect(SCREEN_WIDTH - 200, SCREEN_HEIGHT - 100, 150, 50)
        
        # Tutorial button
        tutorial_button_rect = pygame.Rect(SCREEN_WIDTH - 400, SCREEN_HEIGHT - 100, 150, 50)

        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 4:  # Mouse wheel up
                        scroll_offset = max(scroll_offset - scroll_speed, 0)
                    elif event.button == 5:  # Mouse wheel down
                        scroll_offset += scroll_speed
                    elif event.button == 1:  # Left mouse button
                        if back_button_rect.collidepoint(event.pos):
                            if select_sound: select_sound.play()
                            running = False  # Exit the loop and return to menu
                        elif tutorial_button_rect.collidepoint(event.pos):
                            if select_sound: select_sound.play()
                            tutorial()

            # Clear the screen
            screen.fill(Pale_Purple)

            # Render and display the text
            instructions_text(screen, game_text, Dark_Purple, text_rect, font, bold_italic_underlined_font, scroll_offset=scroll_offset)

            # Draw back button
            pygame.draw.rect(screen, Dark_Purple , back_button_rect)
            back_text = font.render(get_translation("BACK"), True, Pale_Purple)
            screen.blit(back_text, (back_button_rect.centerx - back_text.get_width() // 2, back_button_rect.centery - back_text.get_height() // 2))

            # Draw tutorial button
            pygame.draw.rect(screen, Dark_Purple , tutorial_button_rect)
            tutorial_text = font.render(get_translation("TUTORIAL"), True, Pale_Purple)
            screen.blit(tutorial_text, (tutorial_button_rect.centerx - tutorial_text.get_width() // 2, tutorial_button_rect.centery - tutorial_text.get_height() // 2))

            # Update the display
            pygame.display.flip()

            # Cap the frame rate
            clock.tick(30)



# Define button rectangles
english_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 275, 200, 50)
french_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 345, 200, 50)
spanish_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 415, 200, 50)
german_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 485, 200, 50)

def language():
    global current_language, t 
    
    t += 0.01  # Increment time variable for color animation
    dynamic_color = get_color(t)  # Get dynamic colors
    # Draw background image
    background_image = pygame.image.load('language.jpg')
    background_image = pygame.transform.scale(background_image, (SCREEN_WIDTH, SCREEN_HEIGHT))
    screen.blit(background_image, (0, 0))
    # Customize Menu
    draw_text(get_translation('LANGUAGE SELECTION'), font_main, dynamic_color, screen, SCREEN_WIDTH / 2, 150)
    # Get mouse position
    mouse_pos = pygame.mouse.get_pos()
    buttons = [
        (english_button_rect, 'ENGLISH', 300),
        (french_button_rect, 'FRENCH', 370),
        (spanish_button_rect, 'SPANISH', 440),
        (german_button_rect, 'GERMAN', 510)
    ]
    for rect, language, y in buttons:
        if rect.collidepoint(mouse_pos):
            draw_text(get_translation(language), font_option, (255, 0, 0), screen, SCREEN_WIDTH / 2, y)
            if any(pygame.mouse.get_pressed()):  # Check for mouse click
                if select_sound: select_sound.play()
                current_language = language
        else:
            draw_text(language, font_option, dynamic_color, screen, SCREEN_WIDTH / 2, y)
    # Draw CLOSE button which changes to red when mouse hovers over it
    if close_button_rect.collidepoint(mouse_pos):
        pygame.draw.rect(screen, (255, 0, 0), close_button_rect)
        if any(pygame.mouse.get_pressed()):
            if select_sound: select_sound.play()
    else:
        pygame.draw.rect(screen, Pale_Blue, close_button_rect)
    draw_text(get_translation("CLOSE"), font_option, (255, 255, 255), screen, SCREEN_WIDTH / 2, 625)


def theme_menu():
    
    current_theme = get_translation("default")
    
    running = True
    while running:
        global t
        t += 0.01  # Increment time variable for color animation
        dynamic_color = get_color(t)  # Get dynamic colors

        # Draw background image
        screen.blit(background_image, (0, 0))
        
        draw_text(get_translation('SELECT YOUR THEME'), font_main, dynamic_color, screen, SCREEN_WIDTH / 2, 150)
        draw_text(get_translation(f'Theme : {current_theme}'), font_option, dynamic_color, screen, SCREEN_WIDTH / 2, 200)

        mouse_pos = pygame.mouse.get_pos()
        
        buttons = [
            (summer_button_rect, get_translation('SUMMER'), 275),
            (winter_button_rect, get_translation('WINTER'), 345),
            (autumn_button_rect, get_translation('AUTUMN'), 415),
            (spring_button_rect, get_translation('SPRING'), 485),
            (return_to_settings_button_rect, get_translation('BACK'), 555),
        ]

        for rect, text, y in buttons:
            if rect.collidepoint(mouse_pos):
                draw_text(text, font_option, RED, screen, SCREEN_WIDTH / 2, y)
            else:
                draw_text(text, font_option, dynamic_color, screen, SCREEN_WIDTH / 2, y)

        pygame.display.flip()
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_x, mouse_y = event.pos
                if winter_button_rect.collidepoint(mouse_x, mouse_y):
                    if select_sound: select_sound.play()
                    current_theme = get_translation("WINTER")
                    
                if summer_button_rect.collidepoint(mouse_x, mouse_y):
                    if select_sound: select_sound.play()
                    current_theme = get_translation("SUMMER")
                    
                if autumn_button_rect.collidepoint(mouse_x, mouse_y):
                    if select_sound: select_sound.play()
                    current_theme = get_translation("AUTUMN")
                    
                if spring_button_rect.collidepoint(mouse_x, mouse_y):
                    if select_sound: select_sound.play()
                    current_theme = get_translation("SPRING")
                    
                if return_to_settings_button_rect.collidepoint(mouse_x, mouse_y):
                    if select_sound: select_sound.play()
                    return
                
def skin():

    FONT_LARGE = pygame.font.Font('Playground.ttf', 40)

    # Initialize screen
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))

    def draw_text(text, font, color, surface, x, y):
        text_obj = font.render(text, True, color)
        text_rect = text_obj.get_rect(center=(x, y))
        surface.blit(text_obj, text_rect)

    # Defining blinky and Load images
    santa_rect = pygame.Rect(200, 80, 180, 180)
    santa = pygame.image.load('santa.png')
    santa = pygame.transform.scale(santa, (180, 180))

    buffalo_rect = pygame.Rect(450, 80, 180, 180)
    buffalo = pygame.image.load('buffalo.png')
    buffalo = pygame.transform.scale(buffalo, (180, 180))

    redeye_rect = pygame.Rect(700, 80, 180, 180)
    redeye = pygame.image.load('redeye.png')
    redeye = pygame.transform.scale(redeye, (180, 180))

    devil_rect = pygame.Rect(950, 60, 180, 180)
    devil = pygame.image.load('devil.png')
    devil = pygame.transform.scale(devil, (180, 180))

    # Defining pinky and Load images
    cat_rect = pygame.Rect(200, 250, 180, 180)
    cat = pygame.image.load('cat.png')
    cat = pygame.transform.scale(cat, (180, 180))

    galaxy_rect = pygame.Rect(450, 250, 180, 180)
    galaxy = pygame.image.load('galaxy.png')
    galaxy = pygame.transform.scale(galaxy, (180, 180))

    galaxy2_rect = pygame.Rect(700, 250, 180, 180)
    galaxy2 = pygame.image.load('galaxy2.png')
    galaxy2 = pygame.transform.scale(galaxy2, (180, 180))

    happy_rect = pygame.Rect(950, 250, 180, 180)
    happy = pygame.image.load('happy.png')
    happy = pygame.transform.scale(happy, (180, 180))

    # Defining inky and Load images
    police_rect = pygame.Rect(200, 430, 180, 180)
    police = pygame.image.load('police.png')
    police = pygame.transform.scale(police, (180, 180))

    unicorn_rect = pygame.Rect(450, 430, 180, 180)
    unicorn = pygame.image.load('unicorn.png')
    unicorn = pygame.transform.scale(unicorn, (180, 180))

    cool_rect = pygame.Rect(700, 430, 180, 180)
    cool = pygame.image.load('coolboy.png')
    cool = pygame.transform.scale(cool, (180, 180))

    cowboy_rect = pygame.Rect(950, 430, 180, 180)
    cowboy = pygame.image.load('cowboy.png')
    cowboy = pygame.transform.scale(cowboy, (180, 180))

    # Defining clyde and Load images
    ninja_rect = pygame.Rect(200, 610, 180, 180)
    ninja = pygame.image.load('ninja.png')
    ninja = pygame.transform.scale(ninja, (180, 180))

    karate_rect = pygame.Rect(450, 610, 180, 180)
    karate = pygame.image.load('karate.png')
    karate = pygame.transform.scale(karate, (180, 180))

    yello_rect = pygame.Rect(700, 610, 180, 180)
    yello = pygame.image.load('yello.png')
    yello = pygame.transform.scale(yello, (180, 180))

    yellow_rect = pygame.Rect(950, 610, 180, 180)
    yellow = pygame.image.load('yellow.png')
    yellow = pygame.transform.scale(yellow, (180, 180))

    back_skin_rect = pygame.Rect(70, 50, 200, 50)

    # Main loop
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if santa_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("santa clicked")
                if buffalo_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("buffalo clicked")
                if devil_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("devil clicked")
                if redeye_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("redeye clicked")
                if cat_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("cat clicked")
                if galaxy_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("galaxy clicked")
                if galaxy2_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("galaxy2 clicked")
                if happy_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("happy clicked")
                if police_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("police clicked")
                if unicorn_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("unicorn clicked")
                if cool_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("cool clicked")
                if cowboy_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("cowboy clicked")
                if ninja_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("ninja clicked")
                if karate_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("karate clicked")
                if yello_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("yello clicked")
                if yellow_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("yellow clicked")
                if back_skin_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("back skin clicked")
                    return
                    
        screen.fill(WHITE)

        # Draw text
        draw_text(get_translation('CHOOSE YOUR GHOST SKIN'), FONT_LARGE, BLACK, screen, SCREEN_WIDTH / 2, 40)
        draw_text(get_translation('BACK'), FONT_LARGE, RED, screen, 100, 50)
        draw_text('BLINKY', FONT_LARGE, BLACK, screen, 70, 150)
        draw_text('PINKY', FONT_LARGE, BLACK, screen, 70, 340)
        draw_text('INKY', FONT_LARGE, BLACK, screen, 70, 530)
        draw_text('CLYDE', FONT_LARGE, BLACK, screen, 70, 720)

        # Draw image 
        screen.blit(santa, santa_rect)
        screen.blit(buffalo, buffalo_rect)
        screen.blit(devil, devil_rect)
        screen.blit(redeye, redeye_rect)
        screen.blit(cat, cat_rect)
        screen.blit(galaxy, galaxy_rect)
        screen.blit(galaxy2, galaxy2_rect)
        screen.blit(happy, happy_rect)
        screen.blit(police, police_rect)
        screen.blit(unicorn, unicorn_rect)
        screen.blit(cool, cool_rect)
        screen.blit(cowboy, cowboy_rect)
        screen.blit(ninja, ninja_rect)
        screen.blit(karate, karate_rect)
        screen.blit(yello, yello_rect)
        screen.blit(yellow, yellow_rect)

        pygame.display.flip()

    pygame.quit()
    sys.exit()


def start():
    global t
    t += 0.01  # Increment time variable for color animation
    dynamic_color = get_color(t)  # Get dynamic colors
    # Fonts
    font = pygame.font.Font("Playground.ttf", 40)
    prompt_font = pygame.font.Font("Playground.ttf", 48)

    # Input field variables
    input_box = pygame.Rect(SCREEN_WIDTH // 2 - 200, SCREEN_HEIGHT // 2 - 50, 400, 100)
    text = ''
    cursor = True

    # Particle variables
    particles = []


    clock = pygame.time.Clock()
    cursor_timer = pygame.USEREVENT + 1
    pygame.time.set_timer(cursor_timer, 500)

    prompt_text = get_translation('Enter your name:')
    typed_prompt = ''
    char_index = 0

    # Track button hover state
    enter_button_hover = False
    back_button_hover = False

    # Enter button dimensions and position using pygame.Rect
    button_width = 200
    button_height = 60
    button_x = SCREEN_WIDTH // 2 - button_width // 2
    button_y = input_box.bottom + 20  # Position it just below the input box
    enter_button_rect = pygame.Rect(button_x, button_y, button_width, button_height)

    # Back button dimensions and position using pygame.Rect
    back_button_y = enter_button_rect.bottom + 20  # Position it just below the Enter button
    back_button_rect = pygame.Rect(button_x, back_button_y, button_width, button_height)

    def draw_text_input():
        # Draw background with rounded corners
        bg_color = (240, 240, 240)  # Light gray background color
        border_radius = 20
        pygame.draw.rect(screen, bg_color, input_box, border_radius=border_radius)
        pygame.draw.rect(screen, (0, 0, 0), input_box, width=2, border_radius=border_radius)

        # Render text surface
        txt_surface = font.render(text, True, (0, 0, 0))  # Black text color
        width = max(400, txt_surface.get_width() + 10)
        input_box.w = width

        # Center the text vertically in the input box
        text_x = input_box.x + (input_box.width - txt_surface.get_width()) // 2
        text_y = input_box.y + (input_box.height - txt_surface.get_height()) // 2
        screen.blit(txt_surface, (text_x, text_y))

        # Draw cursor
        if cursor and len(text) < 20:  # Adjust cursor visibility conditions as needed
            cursor_rect = pygame.Rect(text_x + txt_surface.get_width(), text_y, 2, txt_surface.get_height())
            pygame.draw.rect(screen, (0, 0, 0), cursor_rect)

    def create_particles(pos):
        for _ in range(50):  # Adjust the number of particles
            size = random.randint(2, 4)
            speed = random.uniform(1, 3)
            dx = speed * random.uniform(0.5, 1.5) * random.choice([-1, 1])
            dy = speed * random.uniform(0.5, 1.5) * random.choice([-1, 1])
            particles.append([pos[0], pos[1], dx, dy, size])

    def update_particles():
        for particle in particles[:]:  # Iterate over a copy to safely remove elements
            particle[0] += particle[2]  # Update x position
            particle[1] += particle[3]  # Update y position
            particle[4] -= 0.1  # Decrease size
            if particle[4] <= 0:
                particles.remove(particle)

    def draw_particles():
        for particle in particles:
            pygame.draw.circle(screen, (0, 0, 0), (int(particle[0]), int(particle[1])), int(particle[4]))

    def animate_background_blue_gradient():
        global gradient_shift
        gradient_shift = (gradient_shift + 1) % 60 + 180  # Keeping the hue within the blue range (180-240)
        for x in range(SCREEN_WIDTH):
            hue = (gradient_shift + x) % 60 + 180  # Keeping the hue within the blue range (180-240)
            color = pygame.Color(0)
            color.hsla = (hue, 50, 80, 100)  # Hue, Saturation, Lightness, Alpha for pastel blue colors
            pygame.draw.line(screen, color, (x, 0), (x, SCREEN_HEIGHT))

    def draw_enter_button():
        # Determine button color based on hover state
        if enter_button_hover:
            bg_color = RED  # Red color when hovered
        else:
            bg_color = GRAY  # Default gray color

        # Draw background with rounded corners
        border_radius = 15
        pygame.draw.rect(screen, bg_color, enter_button_rect, border_radius=border_radius)
        pygame.draw.rect(screen, BLACK, enter_button_rect, width=2, border_radius=border_radius)

        # Render text surface for "Enter" button
        button_text = get_translation("Enter")
        button_text_surface = font.render(button_text, True, BLACK)
        text_x = button_x + (button_width - button_text_surface.get_width()) // 2
        text_y = button_y + (button_height - button_text_surface.get_height()) // 2
        screen.blit(button_text_surface, (text_x, text_y))

    def draw_back_button():
        # Determine button color based on hover state
        if back_button_hover:
            bg_color = RED  # Red color when hovered
        else:
            bg_color = GRAY  # Default gray color

        # Draw background with rounded corners
        border_radius = 15
        pygame.draw.rect(screen, bg_color, back_button_rect, border_radius=border_radius)
        pygame.draw.rect(screen, BLACK, back_button_rect, width=2, border_radius=border_radius)

        # Render text surface for "Back" button
        button_text = get_translation("Back")
        button_text_surface = font.render(button_text, True, BLACK)
        text_x = button_x + (button_width - button_text_surface.get_width()) // 2
        text_y = back_button_y + (button_height - button_text_surface.get_height()) // 2
        screen.blit(button_text_surface, (text_x, text_y))


    def level_selection():
        # Firefly properties
        fireflies = [{'x': random.randint(0, SCREEN_WIDTH), 'y': random.randint(0, SCREEN_HEIGHT), 'dx': random.choice([-1, 1]), 'dy': random.choice([-1, 1])} for _ in range(20)]
        firefly_speed = 2

        # Fonts
        font = pygame.font.Font("Playground.ttf", 36)
        menu_font = pygame.font.Font("Playground.ttf", 48)

        # Text colors
        WHITE = (255, 255, 255)
        RED = (255, 0, 0)  # Red color for hover effect

        # Function to display text on screen
        def draw_text(text, font, color, surface, x, y):
            textobj = font.render(text, True, color)
            textrect = textobj.get_rect()
            textrect.center = (x, y)
            surface.blit(textobj, textrect)

        # Menu option rectangles
        easy_rect = pygame.Rect(400, 200, 400, 50)
        medium_rect = pygame.Rect(400, 300, 400, 50)
        hard_rect = pygame.Rect(400, 400, 400, 50)
        multiworld_rect = pygame.Rect(400, 500, 400, 50)
        back_rect = pygame.Rect(400, 600, 400, 50)

        # Main game loop
        running = True
        while running:
            mouse_pos = pygame.mouse.get_pos()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    # Check if mouse click is on a menu option
                    if event.button == 1:  # Left mouse button
                        if easy_rect.collidepoint(mouse_pos):
                            if select_sound: select_sound.play()
                        elif medium_rect.collidepoint(mouse_pos):
                            if select_sound: select_sound.play()
                        elif hard_rect.collidepoint(mouse_pos):
                            if select_sound: select_sound.play()
                        elif multiworld_rect.collidepoint(mouse_pos):
                            if select_sound: select_sound.play()
                        elif back_rect.collidepoint(mouse_pos):
                            if select_sound: select_sound.play()
                            return

            # Move fireflies
            for firefly in fireflies:
                firefly['x'] += firefly['dx'] * firefly_speed
                firefly['y'] += firefly['dy'] * firefly_speed

                # Change direction if at screen edge
                if firefly['x'] <= 0 or firefly['x'] >= SCREEN_WIDTH:
                    firefly['dx'] *= -1
                if firefly['y'] <= 0 or firefly['y'] >= SCREEN_HEIGHT:
                    firefly['dy'] *= -1

            # Draw background
            screen.fill((0, 0, 0))  # Black background

            # Draw fireflies
            for firefly in fireflies:
                pygame.draw.circle(screen, (255, 255, 0), (firefly['x'], firefly['y']), 5)

            # Draw text on screen with hover effect

            # Draw buttons and check for hover
            buttons = [
                (easy_rect, get_translation('EASY '), 225),
                (medium_rect, get_translation('MEDIUM') , 323),
                (hard_rect, get_translation('HARD'), 425),
                (multiworld_rect, get_translation('MULTIWORLD'), 525),
                (back_rect, get_translation('BACK'), 625)
            ]

            for rect, text, y in buttons:
                if rect.collidepoint(mouse_pos):
                    draw_text(text, font_option, (255, 0, 0), screen, SCREEN_WIDTH / 2, y)
                else:
                    draw_text(text, font_option, dynamic_color, screen, SCREEN_WIDTH / 2, y)


            # Draw initial text
            draw_text(get_translation(f"Welcome {entered_name}! Choose which level you want to play"), font, dynamic_color, screen, SCREEN_WIDTH // 2, 100)

            # Update display
            pygame.display.flip()
            clock.tick(30)  # Adjust frame rate as needed

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                create_particles(event.pos)
                # Check if mouse click is within the Enter button area
                if enter_button_rect.collidepoint(event.pos):
                    entered_name = text  # Store the entered name
                    if select_sound: select_sound.play()
                    level_selection()
                if back_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    return
                    
                    
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_BACKSPACE:
                    text = text[:-1]
                else:
                    text += event.unicode
            if event.type == cursor_timer:
                cursor = not cursor

            # Check for hover over the Enter button
            if event.type == pygame.MOUSEMOTION:
                if enter_button_rect.collidepoint(event.pos):
                    enter_button_hover = True
                else:
                    enter_button_hover = False
                # Check for hover over the Back button
                if back_button_rect.collidepoint(event.pos):
                    back_button_hover = True
                else:
                    back_button_hover = False

        
        animate_background_blue_gradient()
        draw_text_input()
        draw_enter_button()
        draw_back_button()
        update_particles()
        draw_particles()

        # Typewriter effect for the prompt text
        if char_index < len(prompt_text):
            typed_prompt += prompt_text[char_index]
            char_index += 1

        prompt_surface = prompt_font.render(typed_prompt, True, (0, 0, 0))  # Black text color
        screen.blit(prompt_surface, (input_box.x, input_box.y - 80))
        
        pygame.display.flip()
        clock.tick(20)



# Main game loop
while is_running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:  # If the user clicks on the small 'x' button
            is_running = False
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if in_customize:
                if theme_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    theme_menu()
                elif ghost_skin_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    skin()
                elif return_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    in_customize = False
            elif in_settings:
                if customise_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    in_customize= True
                elif how_to_play_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    text_displayed()
                elif language_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()

                    running = True
                    t = 0
                    while running:
                        mouse_pos = pygame.mouse.get_pos()
                        for event in pygame.event.get():
                            if close_button_rect.collidepoint(mouse_pos):
                                if pygame.mouse.get_pressed()[0]: 
                                    running = False
                        language()

                        pygame.display.flip()

                elif back_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    in_settings = False
            else:
                if start_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    start()
                elif scoreboard_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    print("Scoreboard button clicked!")
                elif settings_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    in_settings = True
                elif quit_button_rect.collidepoint(event.pos):
                    if select_sound: select_sound.play()
                    display_loading_screen()
                    is_running = False

    if in_customize:
        display_customize_menu()
    elif in_settings:
        display_settings_menu()
    else:
        display_main_menu()

    pygame.display.flip()  # Update the display
    clock.tick(FPS)  # Set the frame rate

pygame.quit()  # Quit pygame
sys.exit()

