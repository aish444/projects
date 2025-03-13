import pygame
import sys
import time

# Initialize Pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
MARINE_BLUE = (0, 51, 102)
LIGHT_BLUE = (0, 224, 223)

# Fonts
font_large = pygame.font.Font('Playground.ttf', 72)
font_medium = pygame.font.Font('Playground.ttf', 42)
font_exit = pygame.font.Font("Playground.ttf", 42)

# Initialize screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Game Over Menu")

# Load background images
background_image_game_over = pygame.image.load("gameover.jpg")
background_image_game_over = pygame.transform.scale(background_image_game_over, (SCREEN_WIDTH, SCREEN_HEIGHT))

# Quit button properties
quit_button_rect = pygame.Rect(SCREEN_WIDTH / 2 - 100, 600, 200, 50)
quit_button_color = MARINE_BLUE
quit_button_hover_color = LIGHT_BLUE

def draw_text(text, font, color, surface, x, y):
    text_obj = font.render(text, True, color)
    text_rect = text_obj.get_rect(center=(x, y))
    surface.blit(text_obj, text_rect)

def game_over_menu():
    running = True
    clock = pygame.time.Clock()
    
    # Breathing effect variables
    breathing_scale = 1.0
    scale_direction = 1
    scale_speed = 0.005
    
    while running:
        screen.blit(background_image_game_over, (0, 0))
        
        # Breathing effect for GAME OVER text
        breathing_scale += scale_speed * scale_direction
        if breathing_scale > 1.2 or breathing_scale < 0.8:
            scale_direction *= -1
        game_over_surface = pygame.transform.scale(font_large.render('GAME OVER', True, WHITE), 
                                                   (int(400 * breathing_scale), int(100 * breathing_scale)))
        screen.blit(game_over_surface, (SCREEN_WIDTH // 2 - game_over_surface.get_width() // 2, 200))
        
        ###test values
        highest_score = 1000
        score = 100

        if highest_score > score :
            # Draw total score text
            draw_text(f'Your total score for this level is : {score}', font_medium, WHITE, screen, SCREEN_WIDTH / 2, 400)
            draw_text(f'Your highest score is : {highest_score} ', font_medium, WHITE, screen, SCREEN_WIDTH / 2, 450)
        else:
            highest_score = score
            draw_text(f'New high score is : {highest_score} ', font_medium, WHITE, screen, SCREEN_WIDTH / 2, 500)

        
        # Draw quit button
        mouse_pos = pygame.mouse.get_pos()
        if quit_button_rect.collidepoint(mouse_pos):
            pygame.draw.rect(screen, quit_button_hover_color, quit_button_rect)
        else:
            pygame.draw.rect(screen, quit_button_color, quit_button_rect)
        
        draw_text('QUIT', font_medium, WHITE, screen, quit_button_rect.centerx, quit_button_rect.centery)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                if quit_button_rect.collidepoint(event.pos):
                    exiting_text_animation()
        
        pygame.display.flip()
        clock.tick(60)

def exiting_text_animation():
    x_position = 100
    y_position = 100
    x_speed = 4
    y_speed = 5

    # Set the duration for 12 seconds
    start_time = time.time()
    duration = 8

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

        # Exit the loop after the duration
        if time.time() - start_time > duration:
            pygame.quit()
            sys.exit()

        screen.blit(background_image_game_over, (0, 0))

        # Bouncing effect
        x_position += x_speed
        y_position += y_speed

        if x_position <= 0 or x_position >= screen.get_width() - font_exit.render("exiting..", True, WHITE).get_width():
            x_speed = -x_speed
        if y_position <= 0 or y_position >= screen.get_height() - font_exit.render("exiting..", True, WHITE).get_height():
            y_speed = -y_speed

        screen.blit(font_exit.render("exiting..", True, WHITE), (x_position, y_position))
        pygame.display.flip()
        pygame.time.delay(20)  # Adjust delay for smoother animation

# Run the game over menu
game_over_menu()
