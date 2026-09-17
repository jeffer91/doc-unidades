import React,{useState} from 'react';
import { periodLabel } from '../core/templates/interpolate';
import './DocumentPromptButton.css';

export function DocumentPromptButton({ctx}:{ctx:any}){
  const [status,setStatus]=useState('');

  function buildPrompt(){
    const sections=(ctx.document.sections??[])
      .filter((s:any)=>s.kind!=='info')
      .map((s:any)=>`- ${s.label} (${s.kind})`)
      .join('\n');

    const matrices=(ctx.document.summaryItems??[])
      .map((m:any)=>`- ${m.label}: ${m.matrixId}${m.required===false?' · opcional':' · obligatoria'}`)
      .join('\n');

    const fields=(ctx.document.fields??[])
      .map((f:any)=>{
        const source=f.kind==='system'?'contexto':f.source?.matrixId??'sin fuente';
        const operation=f.operation?` · operación ${f.operation}`:'';
        return `- {{${f.key}}}: ${f.label} · ${f.kind} · fuente ${source}${operation}`;
      })
      .join('\n');

    return `Actúa como especialista en redacción académica e institucional para DOC-UNIDADES.\n\nCONTEXTO DEL DOCUMENTO\n- Unidad: ${ctx.unit}\n- Proceso: ${ctx.process.label}\n- Documento: ${ctx.document.label}\n- Código: ${ctx.document.code??'Sin código configurado'}\n- Tipo: ${ctx.document.documentType??'según configuración institucional'}\n- Período: ${ctx.period?periodLabel(ctx.period):'Sin período seleccionado'}\n\nOBJETIVO\nAyúdame a revisar, completar o mejorar este documento completo respetando su estructura real, sus campos dinámicos, sus matrices y sus reglas institucionales. El contenido debe quedar listo para copiar y pegar en DOC-UNIDADES.\n\nESTRUCTURA DEL DOCUMENTO\n${sections||'- Sin secciones configuradas'}\n\nMATRICES / INSUMOS CONFIGURADOS\n${matrices||'- Sin matrices configuradas'}\n\nCAMPOS DINÁMICOS DISPONIBLES\n${fields||'- Solo campos generales de contexto'}\n\nREGLAS OBLIGATORIAS\n1. Aplica SVD 2.1: los datos deben ser reales, trazables y provenir del contexto, matrices o cálculos definidos.\n2. No inventes cifras, porcentajes, resultados, autores, años, normas, DOI, referencias ni fuentes.\n3. Conserva exactamente los campos dinámicos entre dobles llaves, por ejemplo {{PERIODO}}.\n4. No inventes nuevos {{CAMPOS}}. Usa únicamente los campos disponibles.\n5. Los campos simples se leen desde una fuente real; los compuestos se calculan; los heredados provienen de documentos relacionados.\n6. Si falta un dato obligatorio, indícalo como pendiente; no lo sustituyas por cero ni por información inventada.\n7. Aplica APA 7.ª edición al cuerpo académico, especialmente en citas, referencias, tablas y figuras.\n8. Una tabla solo debe existir cuando aporte lectura precisa o comparación y debe derivarse de datos reales.\n9. Un gráfico solo debe existir cuando aporte comprensión de comparación, distribución, evolución o relación. Todo gráfico se considera Figura según APA 7.\n10. Si propones una tabla o figura y todavía no existen datos suficientes, usa una instrucción estructurada sin inventar valores:\n[TABLA: título | matriz/fuente | variables necesarias]\n[FIGURA: título | tipo de gráfico | matriz/fuente | variables necesarias]\n11. Respeta portada, código documental, firmas, índice automático y reglas RGI/INF.\n12. No mezcles información de otros períodos, unidades, procesos o documentos.\n13. Mantén coherencia entre texto, campos, tablas, gráficos, conclusiones y recomendaciones.\n14. Si una sección no necesita tabla o gráfico, no lo agregues por decoración.\n15. Devuelve contenido formal, claro, institucional y listo para usar.\n\nFORMA DE TRABAJO\nCuando te entregue una sección o información adicional, trabaja únicamente con lo proporcionado y con las reglas anteriores. Si detectas que hace falta un dato o matriz para sostener una afirmación, indícalo expresamente en lugar de inventarlo.`;
  }

  async function copyPrompt(){
    await window.docUnits.clipboard.writeText(buildPrompt());
    setStatus('Copiado');
    setTimeout(()=>setStatus(''),1600);
  }

  return <button type="button" className="document-prompt-card" onClick={copyPrompt} title="Copia el prompt general del documento seleccionado para usarlo en una IA">
    <strong>{status||'Copiar prompt IA'}</strong>
    <small>{status?'Listo para pegar':'Documento completo'}</small>
  </button>;
}
