package com.example.proyecto_tesis_oe.services;

import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.util.Log;
import com.example.proyecto_tesis_oe.ImagePreprocessor;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.io.IOException;

public class OcrService {
    private static final String TAG = "OcrService";

    public interface OcrCallback {
        void onTextRecognized(String text);
        default void onError(Exception e) {
            Log.e(TAG, "Error en OCR", e);
        }
    }

    /**
     * Reconoce texto en múltiples idiomas (Inglés/Latín, Chino, Coreano) con chaining
     * Ahora aplica preprocesamiento previo al OCR
     */
    public static void recognizeText(Context context, String imagePath, OcrCallback callback) {
        try {
            // 1. Preprocesar imagen para mejorar OCR
            Log.d(TAG, "Aplicando preprocesamiento a: " + imagePath);
            Bitmap processedBitmap = ImagePreprocessor.preprocessForOCR(imagePath);
            if (processedBitmap == null) {
                Log.e(TAG, "Fallo en preprocesamiento de imagen");
                callback.onError(new Exception("Preprocesamiento fallido"));
                return;
            }

            // 2. Crear InputImage desde el Bitmap procesado
            InputImage image = InputImage.fromBitmap(processedBitmap, 0);
            Log.d(TAG, "Imagen procesada: " + processedBitmap.getWidth() + "x" + processedBitmap.getHeight());

            // Intento 1: Latín/Inglés (base y rápido)
            recognizeWithLatinScript(image, new OcrCallback() {
                @Override
                public void onTextRecognized(String text) {
                    String cleanedText = cleanDetectedText(text);
                    if (cleanedText != null && cleanedText.length() > 15) {
                        Log.d(TAG, "Texto detectado con Latín/Inglés: " + cleanedText.length() + " caracteres");
                        String detectedLang = detectLanguage(cleanedText);
                        Log.d(TAG, "Idioma inferido: " + detectedLang);
                        callback.onTextRecognized(cleanedText);
                        processedBitmap.recycle(); // Liberar memoria
                    } else {
                        // Intento 2: Chino
                        Log.d(TAG, "Texto Latín insuficiente, intentando Chino...");
                        recognizeWithChineseScript(image, new OcrCallback() {
                            @Override
                            public void onTextRecognized(String text) {
                                String cleanedText = cleanDetectedText(text);
                                if (cleanedText != null && cleanedText.length() > 15) {
                                    Log.d(TAG, "Texto detectado con Chino: " + cleanedText.length() + " caracteres");
                                    String detectedLang = detectLanguage(cleanedText);
                                    Log.d(TAG, "Idioma inferido: " + detectedLang);
                                    callback.onTextRecognized(cleanedText);
                                    processedBitmap.recycle(); // Liberar memoria
                                } else {
                                    // Intento 3: Coreano
                                    Log.d(TAG, "Texto Chino insuficiente, intentando Coreano...");
                                    recognizeWithKoreanScript(image, callback);
                                    processedBitmap.recycle(); // Liberar memoria
                                }
                            }

                            @Override
                            public void onError(Exception e) {
                                Log.w(TAG, "Error en Chino, intentando Coreano...");
                                recognizeWithKoreanScript(image, callback);
                                processedBitmap.recycle(); // Liberar memoria
                            }
                        });
                    }
                }

                @Override
                public void onError(Exception e) {
                    Log.w(TAG, "Error en Latín, intentando Chino...");
                    recognizeWithChineseScript(image, new OcrCallback() {
                        @Override
                        public void onTextRecognized(String text) {
                            String cleanedText = cleanDetectedText(text);
                            if (cleanedText != null && cleanedText.length() > 15) {
                                Log.d(TAG, "Texto detectado con Chino: " + cleanedText.length() + " caracteres");
                                String detectedLang = detectLanguage(cleanedText);
                                Log.d(TAG, "Idioma inferido: " + detectedLang);
                                callback.onTextRecognized(cleanedText);
                                processedBitmap.recycle(); // Liberar memoria
                            } else {
                                Log.d(TAG, "Texto Chino insuficiente, intentando Coreano...");
                                recognizeWithKoreanScript(image, callback);
                                processedBitmap.recycle(); // Liberar memoria
                            }
                        }

                        @Override
                        public void onError(Exception e) {
                            Log.w(TAG, "Error en Chino, intentando Coreano...");
                            recognizeWithKoreanScript(image, callback);
                            processedBitmap.recycle(); // Liberar memoria
                        }
                    });
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error general en OCR", e);
            callback.onError(e);
        }
    }

    /**
     * Reconocedor para Latín/Inglés
     */
    private static void recognizeWithLatinScript(InputImage image, OcrCallback callback) {
        TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);

        recognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    String text = visionText.getText();
                    Log.d(TAG, "Latín - Texto detectado: " + (text != null ? text.length() : 0) + " chars");
                    callback.onTextRecognized(text != null ? text : "");
                    recognizer.close();
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error en Latín", e);
                    callback.onError(e);
                    recognizer.close();
                });
    }

    /**
     * Reconocedor para Chino
     */
    private static void recognizeWithChineseScript(InputImage image, OcrCallback callback) {
        TextRecognizer recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());

        recognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    String text = visionText.getText();
                    Log.d(TAG, "Chino - Texto detectado: " + (text != null ? text.length() : 0) + " chars");
                    callback.onTextRecognized(text != null ? text : "");
                    recognizer.close();
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error en Chino", e);
                    callback.onError(e);
                    recognizer.close();
                });
    }

    /**
     * Reconocedor para Coreano (nuevo)
     */
    private static void recognizeWithKoreanScript(InputImage image, OcrCallback callback) {
        TextRecognizer recognizer = TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build());

        recognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    String text = visionText.getText();
                    Log.d(TAG, "Coreano - Texto detectado: " + (text != null ? text.length() : 0) + " chars");

                    if (text == null || text.trim().isEmpty()) {
                        Log.w(TAG, "No se detectó texto en ningún idioma");
                        callback.onTextRecognized(""); // Vacío si falla todo
                    } else {
                        String cleanedText = cleanDetectedText(text);
                        String detectedLang = detectLanguage(cleanedText);
                        Log.d(TAG, "Idioma inferido: " + detectedLang);
                        callback.onTextRecognized(cleanedText);
                    }
                    recognizer.close();
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error en Coreano", e);
                    callback.onError(e);
                    recognizer.close();
                });
    }

    /**
     * Limpia y normaliza el texto detectado
     */
    private static String cleanDetectedText(String text) {
        if (text == null) return null;

        // 1. Eliminar espacios en blanco innecesarios
        text = text.trim();

        // 2. Reemplazar múltiples espacios/retornos de carro por un solo espacio
        text = text.replaceAll("\\s+", " ");

        // 3. Eliminar caracteres no imprimibles o de control
        text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");

        // 4. Eliminar cadenas de caracteres extraños repetidos (como "---", "///")
        text = text.replaceAll("([\\-\\./])\\1{2,}", "$1");

        // 5. Limpiar líneas vacías sobrantes
        text = text.replaceAll("\\n\\s*\\n", "\n");

        return text;
    }

    /**
     * Detecta si el texto contiene caracteres asiáticos (Chino/Japonés/Coreano)
     */
    public static boolean containsAsianCharacters(String text) {
        if (text == null) return false;
        for (char c : text.toCharArray()) {
            if ((c >= 0x4E00 && c <= 0x9FFF) ||  // CJK (Chino/Japonés)
                    (c >= 0x3040 && c <= 0x309F) ||  // Hiragana
                    (c >= 0x30A0 && c <= 0x30FF) ||  // Katakana
                    (c >= 0xAC00 && c <= 0xD7AF)) {  // Hangul (Coreano)
                return true;
            }
        }
        return false;
    }

    /**
     * Detecta específicamente Coreano (solo Hangul)
     */
    public static boolean isKorean(String text) {
        if (text == null) return false;
        boolean hasHangul = false;
        boolean hasOtherAsian = false;
        for (char c : text.toCharArray()) {
            if (c >= 0xAC00 && c <= 0xD7AF) {  // Hangul
                hasHangul = true;
            } else if ((c >= 0x4E00 && c <= 0x9FFF) ||  // CJK
                    (c >= 0x3040 && c <= 0x309F) ||  // Hiragana
                    (c >= 0x30A0 && c <= 0x30FF)) {  // Katakana
                hasOtherAsian = true;
            }
        }
        return hasHangul && !hasOtherAsian;
    }

    /**
     * Detecta específicamente Chino (solo CJK)
     */
    public static boolean isChinese(String text) {
        if (text == null) return false;
        boolean hasCJK = false;
        boolean hasOther = false;
        for (char c : text.toCharArray()) {
            if (c >= 0x4E00 && c <= 0x9FFF) {  // CJK
                hasCJK = true;
            } else if ((c >= 0x3040 && c <= 0x309F) ||  // Hiragana
                    (c >= 0x30A0 && c <= 0x30FF) ||  // Katakana
                    (c >= 0xAC00 && c <= 0xD7AF)) {  // Hangul
                hasOther = true;
            }
        }
        return hasCJK && !hasOther;
    }

    /**
     * Inferir idioma principal
     */
    public static String detectLanguage(String text) {
        if (text == null || text.trim().isEmpty()) return "unknown";

        boolean hasLatinOnly = true;
        boolean isAsian = containsAsianCharacters(text);

        for (char c : text.toCharArray()) {
            if (!((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
                    (c >= '0' && c <= '9') || (c == ' ' || c == '.' || c == ',' || c == '-' || c == '/' || c == '\n'))) {
                hasLatinOnly = false;
            }
        }

        if (hasLatinOnly && !isAsian) {
            return "en";  // Inglés/Latín
        } else if (isKorean(text)) {
            return "ko";  // Coreano
        } else if (isChinese(text)) {
            return "zh";  // Chino
        } else if (isAsian) {
            return "mixed_asian";
        }
        return "unknown";
    }
}