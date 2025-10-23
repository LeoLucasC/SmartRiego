package com.example.proyecto_tesis_oe;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Inicio extends AppCompatActivity {
    private static final String TAG = "Inicio";
    private static final int CAMERA_PERMISSION_CODE = 100;

    // Variables de cámara
    private ImageCapture imageCapture;
    private Camera camera;
    private ExecutorService cameraExecutor;
    private PreviewView previewView;

    // Variables de UI
    private TextView statusTextView;
    private TextView processingTextView;
    private ProgressBar progressBar;
    private Button captureButton;
    private Button flashlightButton;
    private View scanLine;
    private View scanFrame;
    private ImageView capturedImageOverlay;

    // Variables de estado
    private ObjectAnimator scanAnimator;
    private boolean isProcessing = false;
    private boolean isFlashlightOn = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate: Iniciando actividad Inicio");
        setContentView(R.layout.inicio_activity);

        initializeViews();
        cameraExecutor = Executors.newSingleThreadExecutor();

        if (hasCameraPermission()) {
            Log.d(TAG, "Permiso de cámara ya otorgado");
            startCamera();
        } else {
            Log.d(TAG, "Solicitando permiso de cámara");
            requestCameraPermission();
        }

        // Listener para botón de captura
        captureButton.setOnClickListener(v -> {
            if (!isProcessing) {
                Log.d(TAG, "Botón Tomar Foto presionado");
                takePicture();
            }
        });

        // Listener para botón de linterna
        flashlightButton.setOnClickListener(v -> toggleFlashlight());
    }

    private void initializeViews() {
        statusTextView = findViewById(R.id.statusText);
        processingTextView = findViewById(R.id.processingText);
        progressBar = findViewById(R.id.progressBar);
        captureButton = findViewById(R.id.captureButton);
        flashlightButton = findViewById(R.id.flashlightButton);
        scanLine = findViewById(R.id.scanLine);
        scanFrame = findViewById(R.id.scanFrame);
        capturedImageOverlay = findViewById(R.id.capturedImageOverlay);
        previewView = findViewById(R.id.cameraPreview);

        progressBar.setVisibility(View.GONE);
        processingTextView.setVisibility(View.GONE);
        scanLine.setVisibility(View.GONE);
        capturedImageOverlay.setVisibility(View.GONE);

        updateStatus("📷 Cámara lista - Captura una etiqueta");

        // Iniciar animación de escaneo idle
        startIdleScanAnimation();
    }

    /**
     * Animación de escaneo idle (cuando no está capturando)
     */
    private void startIdleScanAnimation() {
        scanLine.setVisibility(View.VISIBLE);

        scanAnimator = ObjectAnimator.ofFloat(scanLine, "translationY",
                0f, scanFrame.getHeight() - scanLine.getHeight());
        scanAnimator.setDuration(2000);
        scanAnimator.setRepeatCount(ValueAnimator.INFINITE);
        scanAnimator.setRepeatMode(ValueAnimator.RESTART);
        scanAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        scanAnimator.start();
    }

    /**
     * Animación de escaneo rápido (durante captura)
     */
    private void startCaptureScanAnimation() {
        if (scanAnimator != null) {
            scanAnimator.cancel();
        }

        scanLine.setVisibility(View.VISIBLE);
        scanLine.setAlpha(1.0f);

        scanAnimator = ObjectAnimator.ofFloat(scanLine, "translationY",
                0f, scanFrame.getHeight() - scanLine.getHeight());
        scanAnimator.setDuration(400);
        scanAnimator.setRepeatCount(3);
        scanAnimator.setRepeatMode(ValueAnimator.RESTART);
        scanAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        scanAnimator.start();

        new Handler().postDelayed(() -> {
            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(scanLine, "alpha", 1.0f, 0f);
            fadeOut.setDuration(300);
            fadeOut.start();
        }, 1200);
    }

    private void stopScanAnimation() {
        if (scanAnimator != null) {
            scanAnimator.cancel();
        }
        scanLine.setVisibility(View.GONE);
    }

    private boolean hasCameraPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void requestCameraPermission() {
        ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.CAMERA},
                CAMERA_PERMISSION_CODE
        );
    }

    private void startCamera() {
        Log.d(TAG, "startCamera: Iniciando cámara...");
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                Log.d(TAG, "Cámara provider obtenida");

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                imageCapture = new ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                        .setFlashMode(ImageCapture.FLASH_MODE_OFF) // Flash OFF por defecto
                        .build();

                Log.d(TAG, "ImageCapture creado con máxima calidad (flash controlado por linterna)");

                CameraSelector cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                        .build();

                cameraProvider.unbindAll();

                // Guardar referencia de la cámara para control de linterna
                camera = cameraProvider.bindToLifecycle(
                        Inicio.this,
                        cameraSelector,
                        preview,
                        imageCapture
                );

                Log.d(TAG, "Cámara ligada exitosamente");
                updateStatus("📷 Cámara lista - Captura una etiqueta");

                // Verificar disponibilidad de linterna
                if (camera.getCameraInfo().hasFlashUnit()) {
                    flashlightButton.setEnabled(true);
                    Log.d(TAG, "✓ Linterna disponible");
                } else {
                    flashlightButton.setEnabled(false);
                    flashlightButton.setAlpha(0.3f);
                    Log.w(TAG, "⚠ Linterna NO disponible en este dispositivo");
                }

            } catch (Exception e) {
                Log.e(TAG, "Error al iniciar la cámara", e);
                updateStatus("❌ Error al iniciar cámara: " + e.getMessage());
            }
        }, ContextCompat.getMainExecutor(Inicio.this));
    }

    /**
     * Control de linterna (encender/apagar)
     */
    private void toggleFlashlight() {
        if (camera == null) {
            Log.w(TAG, "Cámara no inicializada");
            Toast.makeText(this, "Cámara no disponible", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!camera.getCameraInfo().hasFlashUnit()) {
            Toast.makeText(this, "Este dispositivo no tiene linterna", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            isFlashlightOn = !isFlashlightOn;
            camera.getCameraControl().enableTorch(isFlashlightOn);

            // Actualizar UI del botón
            if (isFlashlightOn) {
                flashlightButton.setText("🔦");
                flashlightButton.setBackgroundTintList(
                        android.content.res.ColorStateList.valueOf(0xFFFFC107) // Amarillo
                );
                Log.d(TAG, "🔦 Linterna ENCENDIDA");
            } else {
                flashlightButton.setText("💡");
                flashlightButton.setBackgroundTintList(
                        android.content.res.ColorStateList.valueOf(0xFF424242) // Gris
                );
                Log.d(TAG, "💡 Linterna APAGADA");
            }

        } catch (Exception e) {
            Log.e(TAG, "Error al cambiar estado de linterna", e);
            Toast.makeText(this, "Error al controlar linterna", Toast.LENGTH_SHORT).show();
        }
    }

    private void takePicture() {
        if (imageCapture == null) {
            Log.e(TAG, "ImageCapture es null");
            Toast.makeText(this, "Cámara no inicializada", Toast.LENGTH_SHORT).show();
            return;
        }

        File photoFile = new File(getExternalMediaDirs()[0], System.currentTimeMillis() + "_full.jpg");
        ImageCapture.OutputFileOptions outputOptions =
                new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        Log.d(TAG, "📸 Tomando foto: " + photoFile.getAbsolutePath());

        // Mostrar UI de captura
        isProcessing = true;
        captureButton.setEnabled(false);
        captureButton.setAlpha(0.5f);
        progressBar.setVisibility(View.VISIBLE);
        updateStatus("📸 Capturando imagen de alta calidad...");

        // Iniciar animación de escaneo rápido
        startCaptureScanAnimation();

        imageCapture.takePicture(
                outputOptions,
                ContextCompat.getMainExecutor(this),
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults result) {
                        String fullPath = photoFile.getAbsolutePath();
                        Log.d(TAG, "✓ Foto completa guardada: " + fullPath);

                        // Recortar la imagen al área del marco
                        String croppedPath = cropImageToScanFrame(fullPath);
                        if (croppedPath == null) {
                            Log.e(TAG, "❌ Error al recortar la imagen");
                            runOnUiThread(() -> {
                                updateStatus("❌ Error al recortar imagen");
                                Toast.makeText(Inicio.this, "Error al procesar imagen", Toast.LENGTH_SHORT).show();
                                resetUI();
                            });
                            return;
                        }
                        Log.d(TAG, "✂ Imagen recortada guardada: " + croppedPath);

                        // Mostrar imagen recortada como overlay
                        showCapturedImage(croppedPath);

                        updateStatus("✓ Foto capturada y recortada - Procesando...");
                        processingTextView.setVisibility(View.VISIBLE);

                        // Esperar 1.5 segundos antes de cambiar de actividad
                        new Handler().postDelayed(() -> {
                            Intent intent = new Intent(Inicio.this, ResultsActivity.class);
                            intent.putExtra("IMAGE_PATH", croppedPath);
                            startActivity(intent);

                            runOnUiThread(() -> resetUI());
                        }, 1500);
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException exception) {
                        Log.e(TAG, "❌ Error al capturar imagen", exception);
                        runOnUiThread(() -> {
                            updateStatus("❌ Error al capturar");
                            Toast.makeText(Inicio.this,
                                    "Error: " + exception.getMessage(),
                                    Toast.LENGTH_SHORT).show();
                            resetUI();
                        });
                    }
                }
        );
    }

    /**
     * Recorta la imagen capturada para obtener solo la región del marco de escaneo.
     * VERSIÓN MEJORADA con compensación de aspect ratio
     */
    private String cropImageToScanFrame(String fullImagePath) {
        try {
            // 1. Cargar imagen completa
            Bitmap fullBitmap = BitmapFactory.decodeFile(fullImagePath);
            if (fullBitmap == null) {
                Log.e(TAG, "No se pudo decodificar la imagen: " + fullImagePath);
                return null;
            }

            int imageWidth = fullBitmap.getWidth();
            int imageHeight = fullBitmap.getHeight();

            // 2. Obtener dimensiones de la vista previa
            int previewWidth = previewView.getWidth();
            int previewHeight = previewView.getHeight();

            Log.d(TAG, "=== DIAGNÓSTICO DE RECORTE ===");
            Log.d(TAG, "Vista previa: " + previewWidth + "x" + previewHeight);
            Log.d(TAG, "Imagen capturada: " + imageWidth + "x" + imageHeight);

            // 3. Calcular aspect ratios
            float previewAspect = (float) previewWidth / previewHeight;
            float imageAspect = (float) imageWidth / imageHeight;

            Log.d(TAG, "Preview aspect: " + previewAspect);
            Log.d(TAG, "Image aspect: " + imageAspect);

            // 4. Calcular el área visible de la imagen en la preview
            int visibleImageWidth, visibleImageHeight;
            int offsetX = 0, offsetY = 0;

            if (imageAspect > previewAspect) {
                // La imagen es más ancha: se recortan los lados
                visibleImageHeight = imageHeight;
                visibleImageWidth = (int) (imageHeight * previewAspect);
                offsetX = (imageWidth - visibleImageWidth) / 2;
            } else {
                // La imagen es más alta: se recortan arriba/abajo
                visibleImageWidth = imageWidth;
                visibleImageHeight = (int) (imageWidth / previewAspect);
                offsetY = (imageHeight - visibleImageHeight) / 2;
            }

            Log.d(TAG, "Área visible: " + visibleImageWidth + "x" + visibleImageHeight);
            Log.d(TAG, "Offset: (" + offsetX + ", " + offsetY + ")");

            // 5. Obtener posición del marco en la preview
            int frameLeft = scanFrame.getLeft() - previewView.getLeft();
            int frameTop = scanFrame.getTop() - previewView.getTop();
            int frameWidth = scanFrame.getWidth();
            int frameHeight = scanFrame.getHeight();

            Log.d(TAG, "Marco en preview: (" + frameLeft + ", " + frameTop + ") " + frameWidth + "x" + frameHeight);

            // 6. Calcular escala
            float scaleX = (float) visibleImageWidth / previewWidth;
            float scaleY = (float) visibleImageHeight / previewHeight;

            Log.d(TAG, "Escala: scaleX=" + scaleX + ", scaleY=" + scaleY);

            // 7. Convertir coordenadas a la imagen
            int cropX = offsetX + (int) (frameLeft * scaleX);
            int cropY = offsetY + (int) (frameTop * scaleY);
            int cropWidth = (int) (frameWidth * scaleX);
            int cropHeight = (int) (frameHeight * scaleY);

            Log.d(TAG, "Área de recorte: (" + cropX + ", " + cropY + ") " + cropWidth + "x" + cropHeight);

            // 8. Validar límites
            cropX = Math.max(0, Math.min(cropX, imageWidth - 1));
            cropY = Math.max(0, Math.min(cropY, imageHeight - 1));
            cropWidth = Math.min(cropWidth, imageWidth - cropX);
            cropHeight = Math.min(cropHeight, imageHeight - cropY);

            if (cropWidth <= 0 || cropHeight <= 0) {
                Log.e(TAG, "Dimensiones de recorte inválidas");
                return null;
            }

            Log.d(TAG, "Área final: (" + cropX + ", " + cropY + ") " + cropWidth + "x" + cropHeight);
            Log.d(TAG, "=============================");

            // 9. Recortar
            Bitmap croppedBitmap = Bitmap.createBitmap(fullBitmap, cropX, cropY, cropWidth, cropHeight);

            // 10. Guardar
            String croppedImagePath = fullImagePath.replace("_full.jpg", "_cropped.jpg");
            File croppedFile = new File(croppedImagePath);

            try (java.io.FileOutputStream out = new java.io.FileOutputStream(croppedFile)) {
                croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 95, out);
                Log.d(TAG, "✓ Imagen recortada guardada: " + croppedImagePath);
            }

            // 11. Liberar memoria
            croppedBitmap.recycle();
            fullBitmap.recycle();

            return croppedImagePath;

        } catch (Exception e) {
            Log.e(TAG, "Error en cropImageToScanFrame", e);
            return null;
        }
    }

    /**
     * Muestra la imagen capturada como overlay
     */
    private void showCapturedImage(String imagePath) {
        runOnUiThread(() -> {
            try {
                Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
                if (bitmap != null) {
                    capturedImageOverlay.setImageBitmap(bitmap);
                    capturedImageOverlay.setVisibility(View.VISIBLE);

                    capturedImageOverlay.setAlpha(0f);
                    capturedImageOverlay.animate()
                            .alpha(0.9f)
                            .setDuration(300)
                            .start();

                    Log.d(TAG, "✓ Imagen mostrada como overlay");
                } else {
                    Log.e(TAG, "Bitmap es null: " + imagePath);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error al mostrar imagen", e);
            }
        });
    }

    /**
     * Resetea la UI al estado inicial
     */
    private void resetUI() {
        isProcessing = false;
        captureButton.setEnabled(true);
        captureButton.setAlpha(1.0f);
        progressBar.setVisibility(View.GONE);
        processingTextView.setVisibility(View.GONE);
        capturedImageOverlay.setVisibility(View.GONE);
        updateStatus("📷 Cámara lista - Captura una etiqueta");

        startIdleScanAnimation();
    }

    private void updateStatus(final String message) {
        runOnUiThread(() -> {
            if (statusTextView != null) {
                statusTextView.setText(message);
                Log.d(TAG, "Status: " + message);
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "✓ Permiso de cámara otorgado");
                startCamera();
            } else {
                Log.e(TAG, "❌ Permiso de cámara denegado");
                updateStatus("❌ Permiso de cámara denegado");
                Toast.makeText(this, "Se requiere permiso de cámara", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopScanAnimation();

        // Apagar linterna al pausar
        if (camera != null && isFlashlightOn) {
            try {
                camera.getCameraControl().enableTorch(false);
                isFlashlightOn = false;
                flashlightButton.setText("💡");
                flashlightButton.setBackgroundTintList(
                        android.content.res.ColorStateList.valueOf(0xFF424242)
                );
                Log.d(TAG, "💡 Linterna apagada al pausar");
            } catch (Exception e) {
                Log.e(TAG, "Error al apagar linterna en onPause", e);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!isProcessing && scanFrame != null) {
            startIdleScanAnimation();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy: Cerrando recursos");

        // Apagar linterna antes de cerrar
        if (camera != null && isFlashlightOn) {
            try {
                camera.getCameraControl().enableTorch(false);
                Log.d(TAG, "💡 Linterna apagada al cerrar");
            } catch (Exception e) {
                Log.e(TAG, "Error al apagar linterna", e);
            }
        }

        stopScanAnimation();
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }
    }
}