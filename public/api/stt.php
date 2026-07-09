<?php
// Proxy для Yandex SpeechKit — обходит CORS ограничения браузера
$apiKey = getenv('YANDEX_API_KEY') ?: '';

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'YANDEX_API_KEY not set on server']]);
    exit;
}

$query = $_SERVER['QUERY_STRING'] ?? 'lang=ru-RU&format=lpcm&sampleRateHertz=16000';
$url = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?' . $query;

$body = file_get_contents('php://input');

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Api-Key ' . $apiKey,
        'Content-Type: application/octet-stream',
        'Transfer-Encoding: chunked',
    ],
]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($status);
header('Content-Type: application/json');
echo $result;
