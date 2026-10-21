module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pregunta, contexto_datos } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la API Key de Gemini en las variables de entorno de Vercel.' });
    }

    const systemInstruction = `Eres un asistente de negocio experto y CFO para un salón de belleza. Analiza los datos de Supabase y responde con precisión, cálculos exactos, márgenes y visión financiera profesional.`;

    const modelosAProbar = [
        'gemini-3.6-flash'
    ];

    let respuestaTexto = null;
    let exito = false;
    let ultimoError = '';

    for (const modelo of modelosAProbar) {
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: `CONTEXTO ACTUAL DE LA BASE DE DATOS (SUPABASE):\n${JSON.stringify(contexto_datos)}` },
                                { text: `PREGUNTA DEL ADMINISTRADOR: ${pregunta}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2
                    }
                })
            });

            const data = await geminiResponse.json();

            if (geminiResponse.ok) {
                respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (respuestaTexto) {
                    exito = true;
                    break;
                }
            } else {
                ultimoError = data.error?.message || 'Error desconocido';
                console.warn(`El modelo ${modelo} falló, intentando con el siguiente...`);
            }
        } catch (err) {
            ultimoError = err.message;
            console.warn(`Error de conexión con el modelo ${modelo}:`, err.message);
        }
    }

    if (!exito) {
        return res.status(500).json({ error: 'Todos los modelos están ocupados o alcanzaron su límite. Detalle: ' + ultimoError });
    }

    return res.status(200).json({ respuesta: respuestaTexto });
};