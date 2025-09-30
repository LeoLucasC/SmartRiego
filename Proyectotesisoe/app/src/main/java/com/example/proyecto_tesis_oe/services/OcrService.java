package com.example.proyecto_tesis_oe.services;

import android.content.Context;
import android.net.Uri;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import java.io.File;
import java.io.IOException;

public class OcrService {
    public interface OcrCallback {
        void onTextRecognized(String text);
    }

    public static void recognizeText(Context context, String imagePath, OcrCallback callback) {
        try {
            Uri imageUri = Uri.fromFile(new File(imagePath));
            InputImage image = InputImage.fromFilePath(context, imageUri);
            TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build())
                    .process(image)
                    .addOnSuccessListener((Text visionText) -> callback.onTextRecognized(visionText.getText()))
                    .addOnFailureListener((Exception e) -> callback.onTextRecognized("Error en OCR: " + e.getMessage()));
        } catch (IOException e) {
            callback.onTextRecognized("Error al cargar la imagen: " + e.getMessage());
        }
    }
}