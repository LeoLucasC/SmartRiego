package com.example.proyecto_tesis_oe;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.proyecto_tesis_oe.services.OcrService;
import com.example.proyecto_tesis_oe.services.TranslationService;

public class ResultsActivity extends AppCompatActivity {
    private static final String TAG = "ResultsActivity";

    private TextView recognizedTextView;
    private TextView translatedTextView;
    private Button backButton;
    private Button copyTextButton;
    private Button copyTranslationButton;

    private String recognizedText = "";
    private String translatedText = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_results);

        initializeViews();
        setupClickListeners();

        // Obtener ruta de la imagen del Intent
        String imagePath = getIntent().getStringExtra("IMAGE_PATH");

        if (imagePath != null) {
            Log.d(TAG, "Procesando imagen: " + imagePath);
            processImage(imagePath);
        } else {
            Log.e(TAG, "No se recibió ruta de imagen");
            showError("Error: No se recibió la imagen");
        }
    }

    private void initializeViews() {
        recognizedTextView = findViewById(R.id.recognizedText);
        translatedTextView = findViewById(R.id.translatedText);
        backButton = findViewById(R.id.backButton);
        copyTextButton = findViewById(R.id.copyTextButton);
        copyTranslationButton = findViewById(R.id.copyTranslationButton);

        // Texto inicial
        recognizedTextView.setText("🔍 Reconociendo texto...");
        translatedTextView.setText("⏳ Esperando reconocimiento...");
    }

    private void setupClickListeners() {
        backButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish(); // Volver a Inicio
            }
        });

        copyTextButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                copyToClipboard("Texto Reconocido", recognizedText);
            }
        });

        copyTranslationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                copyToClipboard("Traducción", translatedText);
            }
        });
    }

    private void processImage(String imagePath) {
        // Paso 1: Reconocer texto con OCR
        OcrService.recognizeText(this, imagePath, new OcrService.OcrCallback() {
            @Override
            public void onTextRecognized(String text) {
                Log.d(TAG, "Texto reconocido: " + (text != null ? text.length() : 0) + " caracteres");

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (text == null || text.trim().isEmpty()) {
                            recognizedText = "❌ No se detectó texto en la imagen";
                            recognizedTextView.setText(recognizedText);
                            translatedTextView.setText("⚠️ No hay texto para traducir");
                            Toast.makeText(ResultsActivity.this,
                                    "No se detectó texto legible",
                                    Toast.LENGTH_LONG).show();
                            return;
                        }

                        // Mostrar texto reconocido
                        recognizedText = text;
                        recognizedTextView.setText(text);

                        // Indicar que está traduciendo
                        translatedTextView.setText("🔄 Traduciendo...");

                        // Paso 2: Traducir texto
                        translateText(text);
                    }
                });
            }

            @Override
            public void onError(Exception e) {
                Log.e(TAG, "Error en OCR", e);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        showError("Error en OCR: " + e.getMessage());
                    }
                });
            }
        });
    }

    private void translateText(String text) {
        TranslationService.translateText(text, new TranslationService.TranslationCallback() {
            @Override
            public void onTextTranslated(String translated) {
                Log.d(TAG, "Traducción completada");

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        translatedText = translated;
                        translatedTextView.setText(translated);
                        Toast.makeText(ResultsActivity.this,
                                "✅ Traducción completada",
                                Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Error en traducción: " + error);

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        translatedText = "❌ Error al traducir:\n" + error;
                        translatedTextView.setText(translatedText);

                        Toast.makeText(ResultsActivity.this,
                                "Error en traducción",
                                Toast.LENGTH_LONG).show();
                    }
                });
            }
        });
    }

    private void copyToClipboard(String label, String text) {
        if (text == null || text.trim().isEmpty() || text.startsWith("❌") || text.startsWith("⚠️")) {
            Toast.makeText(this, "No hay contenido para copiar", Toast.LENGTH_SHORT).show();
            return;
        }

        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText(label, text);
        clipboard.setPrimaryClip(clip);

        Toast.makeText(this, "📋 " + label + " copiado", Toast.LENGTH_SHORT).show();
        Log.d(TAG, label + " copiado al portapapeles");
    }

    private void showError(String message) {
        recognizedTextView.setText("❌ " + message);
        translatedTextView.setText("⚠️ No se pudo procesar la imagen");
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
}