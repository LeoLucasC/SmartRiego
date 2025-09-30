package com.example.proyecto_tesis_oe.services;

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

public class TranslationService {
    private static final OkHttpClient client = new OkHttpClient();
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    public interface TranslationCallback {
        void onTextTranslated(String translated);
    }

    public static void translateText(String text, TranslationCallback callback) {
        try {
            JSONObject json = new JSONObject();
            json.put("model", "llama3");
            json.put("prompt", "Translate the following text to Spanish: \"" + text + "\"");
            json.put("stream", false);

            RequestBody body = RequestBody.create(json.toString(), JSON);
            Request request = new Request.Builder()
                    .url("http://localhost:11434/api/generate")
                    .post(body)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callback.onTextTranslated("Error en traducción: " + e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        String responseBody = response.body() != null ? response.body().string() : "{}";
                        JSONObject jsonResponse = null;
                        try {
                            jsonResponse = new JSONObject(responseBody);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                        String translatedText = jsonResponse.optString("response", "Error en la traducción");
                        callback.onTextTranslated(translatedText);
                    } else {
                        callback.onTextTranslated("Error: " + response.code());
                    }
                }
            });
        } catch (Exception e) {
            callback.onTextTranslated("Error en traducción: " + e.getMessage());
        }
    }
}