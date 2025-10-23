package com.example.proyecto_tesis_oe.services;

import android.util.Log;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import java.util.concurrent.TimeUnit;

public class TranslationService {
    private static final String TAG = "TranslationService";

    // IP confirmada para tu PC en red local (puerto 11434 por defecto de Ollama)
    private static final String OLLAMA_URL = "http://192.168.18.38:11434/api/generate";
    // Para emulador Android: cambia a "http://10.0.2.2:11434/api/generate"
    // Para dispositivo físico: mantén la IP local si estás en la misma WiFi

    // Cambiado a tu modelo custom (el que tienes instalado y quieres usar)
    private static final String MODEL = "mi-traductor-etiquetas:latest";
    private static final int TIMEOUT_SECONDS = 60;

    public interface TranslationCallback {
        void onTextTranslated(String translatedText);
        default void onError(String error) {
            Log.e(TAG, "Error en traducción: " + error);
        }
    }

    /**
     * Traduce texto usando Ollama en red local
     */
    public static void translateText(String sourceText, TranslationCallback callback) {
        if (sourceText == null || sourceText.trim().isEmpty()) {
            Log.w(TAG, "Texto vacío, no se puede traducir");
            callback.onError("No hay texto para traducir");
            return;
        }

        Log.d(TAG, "Iniciando traducción de texto: " + sourceText.substring(0, Math.min(50, sourceText.length())) + "...");

        // Detectar idioma con OcrService para prompt personalizado
        String detectedLang = OcrService.detectLanguage(sourceText);
        Log.d(TAG, "Idioma detectado: " + detectedLang);

        // Crear prompt optimizado basado en idioma
        String prompt = createTranslationPrompt(sourceText, detectedLang);

        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("model", MODEL);
            jsonBody.put("prompt", prompt);
            jsonBody.put("stream", false); // Sin streaming para simplificar

            // Opciones para prevenir alucinaciones (bajas para traducciones precisas)
            JSONObject options = new JSONObject();
            options.put("temperature", 0.3);
            options.put("num_predict", 500); // Limitar tokens generados
            jsonBody.put("options", options);

            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .build();

            RequestBody body = RequestBody.create(
                    jsonBody.toString(),
                    MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                    .url(OLLAMA_URL)
                    .post(body)
                    .build();

            Log.d(TAG, "Enviando petición a Ollama: " + OLLAMA_URL + " (modelo: " + MODEL + ", lang: " + detectedLang + ")");

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Error de conexión con Ollama", e);
                    String errorMsg = "Error de conexión: " + e.getMessage() +
                            "\n\n💡 Verifica:\n" +
                            "1. Ollama está ejecutándose: corre 'ollama serve' en terminal\n" +
                            "2. La IP/puerto es correcto: " + OLLAMA_URL + "\n" +
                            "3. Firewall permite puerto 11434 (TCP)\n" +
                            "4. Para emulador: usa http://10.0.2.2:11434/api/generate\n" +
                            "5. Modelo cargado: 'ollama list' muestra '" + MODEL + "'";
                    callback.onError(errorMsg);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        String errorBody = response.body() != null ? response.body().string() : "Sin detalles";
                        Log.e(TAG, "Respuesta de error de Ollama: " + errorBody);
                        callback.onError("Error HTTP " + response.code() + ": " + errorBody);
                        response.close();
                        return;
                    }

                    try {
                        String responseBody = response.body().string();
                        Log.d(TAG, "Respuesta recibida de Ollama");

                        JSONObject jsonResponse = new JSONObject(responseBody);
                        String translatedText = jsonResponse.getString("response");

                        if (translatedText == null || translatedText.trim().isEmpty()) {
                            Log.w(TAG, "Traducción vacía recibida");
                            callback.onError("El modelo no generó traducción (verifica si el modelo está optimizado para prompts de '" + detectedLang + "')");
                            return;
                        }

                        Log.d(TAG, "Traducción exitosa (" + detectedLang + " → ES): " + translatedText.substring(0, Math.min(50, translatedText.length())) + "...");
                        callback.onTextTranslated(translatedText.trim());

                    } catch (JSONException e) {
                        Log.e(TAG, "Error al parsear respuesta JSON", e);
                        callback.onError("Error al procesar respuesta: " + e.getMessage());
                    } finally {
                        response.close();
                    }
                }
            });

        } catch (JSONException e) {
            Log.e(TAG, "Error al crear JSON de petición", e);
            callback.onError("Error al crear petición: " + e.getMessage());
        }
    }

    /**
     * Crea un prompt optimizado para tu modelo custom (enfocado en etiquetas de productos)
     * Usa detección de idioma para precisión
     */
    private static String createTranslationPrompt(String text, String detectedLang) {
        String limitedText = text.substring(0, Math.min(500, text.length())); // Limitar para evitar prompts muy largos

        switch (detectedLang) {
            case "ko":
                return String.format(
                        "Traduce el siguiente texto del coreano al español. Es una etiqueta de producto. " +
                                "Mantén secciones como ingredientes, instrucciones, advertencias. " +
                                "Solo devuelve la traducción al español, sin explicaciones adicionales.\n\nTexto original:\n%s",
                        limitedText
                );
            case "zh":
                return String.format(
                        "Traduce el siguiente texto del chino al español. Es una etiqueta de producto. " +
                                "Mantén secciones como ingredientes, instrucciones, advertencias. " +
                                "Solo devuelve la traducción al español, sin explicaciones adicionales.\n\nTexto original:\n%s",
                        limitedText
                );
            case "mixed_asian":
                return String.format(
                        "Traduce el siguiente texto asiático mixto (chino/japonés/coreano) al español. Es una etiqueta de producto. " +
                                "Mantén secciones como ingredientes, instrucciones, advertencias. " +
                                "Solo devuelve la traducción al español, sin explicaciones adicionales.\n\nTexto original:\n%s",
                        limitedText
                );
            case "en":
            default: // Fallback para inglés o unknown
                return String.format(
                        "Traduce el siguiente texto al español. Es una etiqueta de producto en inglés. " +
                                "Mantén el formato original (listas, secciones). " +
                                "Solo devuelve la traducción, máximo 300 palabras, sin introducciones.\n\nTexto original:\n%s",
                        limitedText
                );
        }
    }

    /**
     * Verifica si Ollama está disponible (usa /api/tags para listar modelos)
     */
    public static void checkOllamaConnection(ConnectionCallback callback) {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(5, TimeUnit.SECONDS)
                .build();

        String testUrl = OLLAMA_URL.replace("/api/generate", "/api/tags"); // Endpoint para verificar modelos
        Request request = new Request.Builder()
                .url(testUrl)
                .get()
                .build();

        Log.d(TAG, "Verificando conexión con Ollama: " + testUrl);

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error de conexión con Ollama", e);
                callback.onResult(false, "No se puede conectar: " + e.getMessage() + "\nEjecuta 'ollama serve'");
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                boolean success = response.isSuccessful();
                String message = success ?
                        "Conectado exitosamente. Modelos disponibles: " + (response.body() != null ? response.body().string() : "Verifica ollama list")
                        : "Error HTTP " + response.code();
                Log.d(TAG, "Respuesta de Ollama: " + message);
                callback.onResult(success, message);
                response.close();
            }
        });
    }

    public interface ConnectionCallback {
        void onResult(boolean connected, String message);
    }
}