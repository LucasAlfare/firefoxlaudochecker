/*
https://renatofreire.sisvida.com.br/laboratorio/resultados/conferir_exame/175505?not_print=true&not_print_cabecalho_rodape=true
https://renatofreire.sisvida.com.br/laboratorio/resultados/show/92992
 */

const alertTitle = 'Alterações para adicionar\n(press. "F" para ver novamente):';
let alertText;
const alertIcon = 'info';

window.addEventListener('load', () => {
    document.body.style.border = '3px solid red';

    const laudSource = document.getElementById('resultado_0').innerText.split('ERITROGRAMA')[0];

    const checkings = getCheckings(getAllInfos(laudSource));
    if (checkings.length > 0) {
        alertText = '';
        for (const c of checkings) {
            if (c) {
                if (c.length > 0) {
                    alertText += `- ${c}\n`;
                }
            }
        }

        swal({ title: alertTitle, text: alertText, icon: alertIcon });
    }
});

document.addEventListener('keyup', event => {
    if (event.key === 'f' || event.key === 'F') {
        if (!swal.getState().isOpen) {
            swal({ title: alertTitle, text: alertText, icon: alertIcon });
        }
    }
});
