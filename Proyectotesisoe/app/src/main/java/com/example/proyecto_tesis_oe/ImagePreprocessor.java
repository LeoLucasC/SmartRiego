package com.example.proyecto_tesis_oe;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;
import android.util.Log;

/**
 * Preprocesador de imágenes para mejorar calidad del OCR
 * Aplica técnicas de mejora de imagen antes del reconocimiento de texto
 */
public class ImagePreprocessor {
    private static final String TAG = "ImagePreprocessor";

    /**
     * Procesa una imagen para optimizarla para OCR
     * Aplica: escalado, contraste, nitidez, binarización
     */
    public static Bitmap preprocessForOCR(String imagePath) {
        try {
            // 1. Cargar imagen original
            Bitmap original = BitmapFactory.decodeFile(imagePath);
            if (original == null) {
                Log.e(TAG, "No se pudo cargar la imagen: " + imagePath);
                return null;
            }

            Log.d(TAG, "Imagen cargada: " + original.getWidth() + "x" + original.getHeight());

            // 2. Escalar si es muy grande (máximo 1920x1920 para balance velocidad/calidad)
            Bitmap scaled = scaleImage(original, 1920);

            // 3. Aumentar contraste y nitidez
            Bitmap enhanced = enhanceContrast(scaled, 1.5f); // Factor 1.5 = +50% contraste

            // 4. Convertir a escala de grises optimizada
            Bitmap grayscale = convertToGrayscale(enhanced);

            // 5. Aplicar threshold adaptativo (binarización)
            Bitmap final_img = applyAdaptiveThreshold(grayscale);

            // Liberar bitmaps intermedios
            if (scaled != original) scaled.recycle();
            if (enhanced != scaled) enhanced.recycle();
            if (grayscale != enhanced) grayscale.recycle();

            Log.d(TAG, "Preprocesamiento completado exitosamente");
            return final_img;

        } catch (Exception e) {
            Log.e(TAG, "Error en preprocesamiento", e);
            return null;
        }
    }

    /**
     * Escala la imagen manteniendo aspect ratio
     */
    private static Bitmap scaleImage(Bitmap source, int maxSize) {
        int width = source.getWidth();
        int height = source.getHeight();

        if (width <= maxSize && height <= maxSize) {
            return source; // No escalar si ya es pequeña
        }

        float scale = Math.min((float) maxSize / width, (float) maxSize / height);
        int newWidth = Math.round(width * scale);
        int newHeight = Math.round(height * scale);

        Log.d(TAG, "Escalando de " + width + "x" + height + " a " + newWidth + "x" + newHeight);
        return Bitmap.createScaledBitmap(source, newWidth, newHeight, true);
    }

    /**
     * Aumenta contraste y nitidez de la imagen
     */
    private static Bitmap enhanceContrast(Bitmap source, float contrastFactor) {
        Bitmap result = Bitmap.createBitmap(source.getWidth(), source.getHeight(), source.getConfig());
        Canvas canvas = new Canvas(result);
        Paint paint = new Paint();

        // Matriz de color para aumentar contraste
        float translate = (-.5f * contrastFactor + .5f) * 255.f;
        ColorMatrix cm = new ColorMatrix(new float[] {
                contrastFactor, 0, 0, 0, translate,
                0, contrastFactor, 0, 0, translate,
                0, 0, contrastFactor, 0, translate,
                0, 0, 0, 1, 0
        });

        paint.setColorFilter(new ColorMatrixColorFilter(cm));
        canvas.drawBitmap(source, 0, 0, paint);

        Log.d(TAG, "Contraste aumentado (factor: " + contrastFactor + ")");
        return result;
    }

    /**
     * Convierte a escala de grises usando luminosidad óptima
     */
    private static Bitmap convertToGrayscale(Bitmap source) {
        Bitmap result = Bitmap.createBitmap(source.getWidth(), source.getHeight(), source.getConfig());
        Canvas canvas = new Canvas(result);
        Paint paint = new Paint();

        ColorMatrix cm = new ColorMatrix();
        cm.setSaturation(0); // Elimina color (saturación = 0)
        paint.setColorFilter(new ColorMatrixColorFilter(cm));
        canvas.drawBitmap(source, 0, 0, paint);

        Log.d(TAG, "Convertido a escala de grises");
        return result;
    }

    /**
     * Aplica threshold adaptativo para binarización (blanco/negro puro)
     * Mejora detección de texto en fondos irregulares
     */
    private static Bitmap applyAdaptiveThreshold(Bitmap source) {
        int width = source.getWidth();
        int height = source.getHeight();
        Bitmap result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        int[] pixels = new int[width * height];
        source.getPixels(pixels, 0, width, 0, 0, width, height);

        // Calcular threshold promedio de la imagen
        long sum = 0;
        for (int pixel : pixels) {
            int gray = (pixel >> 16) & 0xff; // Extraer canal R (en grayscale R=G=B)
            sum += gray;
        }
        int threshold = (int) (sum / pixels.length * 0.85); // 85% del promedio como threshold

        // Aplicar binarización
        for (int i = 0; i < pixels.length; i++) {
            int gray = (pixels[i] >> 16) & 0xff;
            pixels[i] = (gray > threshold) ? 0xFFFFFFFF : 0xFF000000; // Blanco o Negro
        }

        result.setPixels(pixels, 0, width, 0, 0, width, height);
        Log.d(TAG, "Threshold adaptativo aplicado (umbral: " + threshold + ")");
        return result;
    }

    /**
     * Guarda bitmap procesado (útil para debugging)
     */
    public static void saveBitmap(Bitmap bitmap, String path) {
        try {
            java.io.FileOutputStream out = new java.io.FileOutputStream(path);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out);
            out.flush();
            out.close();
            Log.d(TAG, "Imagen guardada: " + path);
        } catch (Exception e) {
            Log.e(TAG, "Error al guardar bitmap", e);
        }
    }
}
