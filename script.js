document.addEventListener('DOMContentLoaded', () => {
    const uploadFile = document.getElementById('uploadFile');
    const formContainer = document.getElementById('form-container');
    const generatePromptBtn = document.getElementById('generatePrompt');
    const outputContainer = document.getElementById('output-container');
    const outputPrompt = document.getElementById('outputPrompt');
    const copyPromptBtn = document.getElementById('copyPrompt');
    const downloadTemplateBtn = document.getElementById('downloadTemplate');

    let categoriesData = [];

    const templateData = [
        {
            "category": "Abordagem Terapêutica",
            "type": "single",
            "description": "Selecione a abordagem teórica que guia a sessão.",
            "items": ["TCC (Terapia Cognitivo-Comportamental)", "Psicanálise", "Terapia Humanista", "Terapia Sistêmica"]
        },
        {
            "category": "Estado Inicial do Paciente",
            "type": "multiple",
            "description": "Marque as características observadas na chegada do paciente.",
            "items": ["Ansioso", "Calmo", "Agitado", "Triste", "Confuso", "Comunicação clara"]
        },
        {
            "category": "Recursos e Técnicas Utilizadas",
            "type": "multiple",
            "description": "Selecione os recursos ou técnicas aplicadas durante a sessão.",
            "items": ["Diário de Pensamentos", "Exercícios de Respiração", "Role-playing", "Discussão de sonhos", "Leitura de texto", "Desenho"]
        },
        {
            "category": "Principais Temas Abordados",
            "type": "multiple",
            "description": "Quais foram os temas centrais discutidos na sessão?",
            "items": ["Relacionamentos interpessoais", "Problemas no trabalho/estudo", "Autoconhecimento", "Transtornos de ansiedade", "Questões familiares", "Sentimentos de culpa"]
        }
    ];

    downloadTemplateBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(templateData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_lista_relatorio.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    uploadFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                categoriesData = JSON.parse(e.target.result);
                renderForm(categoriesData);
                generatePromptBtn.style.display = 'block';
                outputContainer.style.display = 'none';
            } catch (error) {
                alert('Erro ao carregar o arquivo. Certifique-se de que é um JSON válido.');
                console.error('Erro de parsing JSON:', error);
            }
        };
        reader.readAsText(file);
    });

    function renderForm(data) {
        formContainer.innerHTML = '';
        data.forEach(category => {
            const card = document.createElement('div');
            card.classList.add('category-card');
            
            card.innerHTML = `
                <h3>${category.category}</h3>
                <p class="description">${category.description}</p>
                <div class="options-container"></div>
            `;
            
            const optionsContainer = card.querySelector('.options-container');
            const inputType = category.type === 'single' ? 'radio' : 'checkbox';
            const name = category.category.replace(/\s+/g, '-').toLowerCase();

            category.items.forEach(item => {
                const optionDiv = document.createElement('div');
                optionDiv.classList.add('option-item');
                
                optionDiv.innerHTML = `
                    <input type="${inputType}" id="${name}-${item}" name="${name}" value="${item}">
                    <label for="${name}-${item}">${item}</label>
                `;
                optionsContainer.appendChild(optionDiv);
            });
            
            formContainer.appendChild(card);
        });
    }

    generatePromptBtn.addEventListener('click', () => {
        const selectedOptions = {};
        categoriesData.forEach(category => {
            const name = category.category.replace(/\s+/g, '-').toLowerCase();
            const inputs = document.querySelectorAll(`input[name="${name}"]:checked`);
            
            if (inputs.length > 0) {
                const items = Array.from(inputs).map(input => input.value);
                selectedOptions[category.category] = items;
            }
        });

        if (Object.keys(selectedOptions).length === 0) {
            alert('Por favor, selecione pelo menos uma opção para gerar o relatório.');
            return;
        }

        const promptText = buildPrompt(selectedOptions);
        outputPrompt.value = promptText;
        outputContainer.style.display = 'block';
    });

    function buildPrompt(options) {
        let prompt = "Crie um relatório de sessão terapêutica detalhado, coeso e profissional. Utilize a estrutura de um relatório padrão (observações iniciais, descrição da sessão, etc.). Baseie-se nas seguintes informações:\n\n";

        for (const category in options) {
            const items = options[category];
            prompt += `- **${category}**: ${items.join(', ')}.\n`;
        }

        prompt += "\nPor favor, adapte o texto para que flua de forma natural, integrando esses pontos de maneira orgânica e evolutiva. Não se limite a apenas listar os itens, crie um texto descritivo e explicativo para cada tópico, de forma que o relatório tenha sentido e coerência.";

        return prompt;
    }

    copyPromptBtn.addEventListener('click', () => {
        outputPrompt.select();
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência!');
    });
});
