import pygame
import sys

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
FONT_LARGE = pygame.font.Font('Playground.ttf', 72)
FONT_MEDIUM = pygame.font.SysFont('impact', 45)

# Initialize screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Game Over Menu")

# Load background image
background_image = pygame.image.load("gameover.jpg")
background_image = pygame.transform.scale(background_image, (SCREEN_WIDTH, SCREEN_HEIGHT))

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
    while running:
        screen.blit(background_image, (0, 0))
        
        # Draw Game Over text
        draw_text('GAME OVER', FONT_LARGE, WHITE, screen, SCREEN_WIDTH / 2, 200)
        
        # Draw total score text
        draw_text('Your total score for this level is : ', FONT_MEDIUM, WHITE, screen, SCREEN_WIDTH / 2, 400)
        draw_text('Your highest score is :  ', FONT_MEDIUM, WHITE, screen, SCREEN_WIDTH / 2, 450)
        
        # Draw quit button
        mouse_pos = pygame.mouse.get_pos()
        if quit_button_rect.collidepoint(mouse_pos):
            pygame.draw.rect(screen, quit_button_hover_color, quit_button_rect)
        else:
            pygame.draw.rect(screen, quit_button_color, quit_button_rect)
        
        draw_text('QUIT', FONT_MEDIUM, WHITE, screen, quit_button_rect.centerx, quit_button_rect.centery)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                if quit_button_rect.collidepoint(event.pos):
                    pygame.quit()
                    sys.exit()
        
        pygame.display.flip()

# Run the game over menu
game_over_menu()
