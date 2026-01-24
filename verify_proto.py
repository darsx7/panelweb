from playwright.sync_api import sync_playwright, expect
import time
import re

def verify_prototyper():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Open Page
        page.goto("http://localhost:5500")

        # Wait for initialization
        time.sleep(1)

        # 2. Open Palette
        print("Opening Palette...")
        page.click("#dockPaletteBtn")
        expect(page.locator("#palettePanel")).to_have_class(re.compile(r"active"))

        # 3. Drag Button to Hero
        print("Dragging component...")
        # Source: Button item in palette
        source = page.locator(".palette-item[data-id='button']")
        # Target: Hero section
        target = page.locator(".hero-content")

        # Drag and Drop
        source.drag_to(target)

        # Verify button exists in hero (it's inserted as last child)
        new_btn = target.locator("button").filter(has_text="Click Aquí").last
        expect(new_btn).to_be_visible()
        print("Component inserted successfully.")

        # 4. Select the new button
        print("Selecting component...")
        # Click to select
        new_btn.click()

        # Verify selection class
        expect(new_btn).to_have_class(re.compile(r"proto-selected"))
        print("Selection successful.")

        # 5. Inspector Test
        print("Testing Inspector...")
        # Check if visible
        inspector = page.locator("#inspectorPanel")
        expect(inspector).to_have_class(re.compile(r"active"))

        # Change background color
        bg_input = page.locator("#inspBgText")
        bg_input.fill("red")
        # Trigger change event manually
        page.evaluate("document.getElementById('inspBgText').dispatchEvent(new Event('change'))")

        # Verify style on element
        color = new_btn.evaluate("el => el.style.backgroundColor")
        if color == "red":
            print("Style applied: Red")
        else:
            print(f"Style mismatch: {color}")

        # Add Interaction
        print("Adding Interaction...")
        page.select_option("#inspInteractionAction", "alert")
        # Wait for input to be visible
        expect(page.locator("#inspInteractionValueGroup")).to_be_visible()

        page.fill("#inspInteractionValue", "Hello Proto")
        page.evaluate("document.getElementById('inspInteractionValue').dispatchEvent(new Event('input'))")

        # Verify attribute
        attr = new_btn.get_attribute("data-interaction")
        print(f"Interaction data: {attr}")

        # 6. Play Mode Test
        print("Switching to Play Mode...")
        page.click("#toggleModeBtn")

        # Verify body class
        expect(page.locator("body")).to_have_class(re.compile(r"proto-play"))

        # Verify tools hidden
        expect(page.locator("#dockPaletteBtn")).to_be_hidden()

        # Setup dialog handler
        dialog_message = []
        page.on("dialog", lambda d: (dialog_message.append(d.message), d.accept()))

        # Click button
        print("Triggering interaction...")
        new_btn.click()

        if "Hello Proto" in dialog_message:
            print("Interaction Success: Alert triggered.")
        else:
            print(f"Interaction Failed. Dialogs: {dialog_message}")

        # Screenshot
        page.screenshot(path="verification_proto.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_prototyper()
