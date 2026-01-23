"""
============================================
SERVIDOR LOCAL - Panel Solar Landing Page
============================================

Este servidor permite:
1. Servir los archivos estáticos (HTML, CSS, JS)
2. Guardar la configuración en config.json

USO:
1. Abre una terminal en esta carpeta
2. Ejecuta: python server.py
3. Abre en el navegador: http://localhost:3000
"""

# ---- Importar módulos ----
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os

# ---- CONFIGURACIÓN ----
PORT = 5500                    # Puerto del servidor (5500, 5501, 5502... para nuevos servicios)
CONFIG_FILE = 'config.json'    # Archivo de configuración de animación
CONTENT_FILE = 'content.json'  # Archivo de contenido de la página
CONTENT_TYPE = 'application/json'  # Tipo de contenido para respuestas JSON
SEPARATOR = '=' * 44           # Línea separadora para mensajes


class CustomHandler(SimpleHTTPRequestHandler):
    """
    Handler personalizado que extiende SimpleHTTPRequestHandler
    para agregar la funcionalidad de guardar configuración
    """
    
    def handle_one_request(self):
        """Sobrescribir para capturar errores de conexión"""
        try:
            super().handle_one_request()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            # Navegador cerró la conexión - ignorar silenciosamente
            pass
    
    def do_OPTIONS(self):
        """Manejar preflight requests para CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """
        Manejar requests POST
        Ruta: /api/save-config → Guarda configuración en config.json
        """
        # ---- Ruta: /api/save-config ----
        if self.path == '/api/save-config':
            try:
                # Leer el contenido del body
                content_length = int(self.headers['Content-Length'])
                body = self.rfile.read(content_length).decode('utf-8')
                
                # Parsear el JSON recibido
                config = json.loads(body)
                
                # Guardar en config.json con formato legible
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=4, ensure_ascii=False)
                
                # Responder con éxito
                self.send_response(200)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                
                response = {
                    'success': True,
                    'message': 'Configuración guardada en config.json'
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
                print(f'✓ Configuración guardada en {CONFIG_FILE}')
                
            except Exception as e:
                # Error al guardar
                self.send_response(400)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                
                response = {
                    'success': False,
                    'message': f'Error: {str(e)}'
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
                print(f'✗ Error al guardar: {e}')
        
        # ---- Ruta: /api/save-content ----
        elif self.path == '/api/save-content':
            try:
                content_length = int(self.headers['Content-Length'])
                body = self.rfile.read(content_length).decode('utf-8')
                content = json.loads(body)
                
                with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(content, f, indent=4, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                
                response = {'success': True, 'message': 'Contenido guardado'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
                print(f'✓ Contenido guardado en {CONTENT_FILE}')
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                response = {'success': False, 'message': f'Error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f'✗ Error al guardar contenido: {e}')
        
        # ---- Ruta: /api/save-styles ----
        elif self.path == '/api/save-styles':
            try:
                content_length = int(self.headers['Content-Length'])
                body = self.rfile.read(content_length).decode('utf-8')
                styles = json.loads(body)
                
                with open('styles.json', 'w', encoding='utf-8') as f:
                    json.dump(styles, f, indent=4, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                
                response = {'success': True, 'message': 'Estilos guardados'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
                print('✓ Estilos guardados en styles.json')
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', CONTENT_TYPE)
                self.end_headers()
                response = {'success': False, 'message': f'Error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f'✗ Error al guardar estilos: {e}')
        
        else:
            # Ruta no encontrada
            self.send_error(404, 'Ruta no encontrada')
    
    def do_GET(self):
        """Agregar headers anti-caché para archivos JSON"""
        if self.path.endswith('.json'):
            # Construir la ruta del archivo relativa al directorio de trabajo
            # Quitar el / inicial del path para obtener ruta relativa
            relative_path = self.path.lstrip('/')
            file_path = os.path.join(os.getcwd(), relative_path)
            
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
            except FileNotFoundError:
                self.send_error(404, f'Archivo no encontrado: {file_path}')
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                # Navegador cerró la conexión - ignorar silenciosamente
                pass
        else:
            # Llamar al método padre para servir otros archivos
            try:
                super().do_GET()
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                # Navegador cerró la conexión - ignorar silenciosamente
                pass
    
    def end_headers(self):
        """Agregar CORS a todas las respuestas"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


def run_server():
    """Iniciar el servidor HTTP"""
    # Cambiar al directorio del script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Crear servidor
    server = HTTPServer(('', PORT), CustomHandler)
    
    # Mensaje de inicio
    print('')
    print(SEPARATOR)
    print('  🌞 SERVIDOR SOLAR PANEL INICIADO')
    print(SEPARATOR)
    print('')
    print(f'  📍 URL: http://localhost:{PORT}')
    print('')
    print('  Endpoints disponibles:')
    print('  • GET  /              → Página principal')
    print('  • POST /api/save-config → Guardar configuración')
    print('')
    print('  Presiona Ctrl+C para detener el servidor')
    print(SEPARATOR)
    print('')
    
    # Iniciar servidor (bloquea hasta Ctrl+C)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n\n👋 Servidor detenido')
        server.shutdown()


# ---- Ejecutar si es el script principal ----
if __name__ == '__main__':
    run_server()
