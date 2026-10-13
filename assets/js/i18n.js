/*
 * Strings that the demos generate at runtime, in English and Portuguese. The
 * language is the page's <html lang>; static prose lives in index.html and
 * index.pt.html. t('key', { name: value }) fills {name} placeholders.
 */
(function (root) {
  'use strict';

  const STRINGS = {
    en: {
      'prior.readout': '{k} of the {r} latent coordinates are shared. Mean correlation between the two fields at the same point, over the prior: {rho}.',
      'prior.scatterAria': 'Value of field 2 against field 1 at each of the 256 points of the drawn pair',
      'prior.x': 'field 1',
      'prior.y': 'field 2',

      'attr.none': 'Neither source',
      'attr.O': 'Operator only',
      'attr.P': 'Prior only',
      'attr.OP': 'Both (what you see)',
      'attr.cellValue': 'mean ρ = {v}',
      'attr.cellMI': 'I = {v} nats',
      'attr.sharesAria': 'Shapley shares of the operator and of the prior, and their sum',
      'attr.phiO': 'φ operator',
      'attr.phiP': 'φ prior',
      'attr.total': 'total',
      'attr.survival': 'The prior alone puts a mean correlation of {prior} between the fields. With these data and the prior as the only source, the posterior keeps {post}, that is {pct}% of it.',
      'attr.oppose': 'The two sources pull in opposite directions: the operator pushes the dependence {dirO}, the prior {dirP}. The final map shows only the net result, {total}.',
      'attr.up': 'up',
      'attr.down': 'down',
      'attr.miNegative': 'With mutual information, the prior\'s share comes out negative here: an unsigned measure cannot tell "two forces cancelling" from "the prior removing dependence".',
      'attr.unsigned': 'The unsigned measure counts negative and positive dependence alike, so opposing sources add up instead of cancelling.',
      'attr.computing': 'Computing the four exact posteriors…',
      'attr.done': 'Four exact posteriors, {ms} ms in your browser.',

      'samp.aria': 'Repeated estimates of the mean correlation from samples, against the exact value',
      'samp.exact': 'exact',
      'samp.biasedTarget': 'what the biased sampler converges to',
      'samp.readout': '{R} repeated estimates with {S} samples each. Mean of the estimates: {mean}; exact value: {exact}; spread (SD): {sd}.',
      'samp.biasNote': ' The biased sampler is off by {gap} however many samples it draws.',
      'samp.computing': 'Drawing samples…',
      'samp.x': 'estimated mean correlation',

      'res.magAria': 'Magnitude error of the surrogate\'s prediction at the eight confirmatory points, against the 4.5% tolerance',
      'res.tol': 'tolerance {tol}%',
      'res.weak': 'weak prior dependence (s = 0.25)',
      'res.strong': 'strong prior dependence (s = 0.75)',
      'res.point': 'κ = {kappa}',
      'res.informative': 'informative',
      'res.lowinfo': 'weak',
      'res.verdict': 'Ranking: τ = {tauO} for the operator and {tauP} for the prior (thresholds {attO} and {attP}): {rank}. Magnitude: worst error {maxErr}% against a tolerance of {tol}%: {mag}. Outcome by the rule registered before the runs: {outcome}.',
      'res.pass': 'passes',
      'res.fail': 'fails',
      'res.outcome.REFUTED': 'H1 refuted',
      'res.outcome.SUPPORTED': 'H1 supported',
      'res.outcome.INDETERMINATE': 'indeterminate',

      'f1.aria': 'Loss of cross-field dependence of the trained network along training, mean of 4 networks with min–max band',
      'f1.x': 'training steps',
      'f1.y': 'dependence lost (%)',
      'f1.main': 'main test',
      'f1.thousand': '{n}k',
      'f1.series': 's = {s}, N = {N}',
      'f1.verdictE': 'erosion supported (4 of 4 networks lose more at 160k than at 20k)',
      'f1.verdictI': 'indeterminate ({up} of {n} networks lose more at 160k)',

      'ref.unverified': 'Bibliographic fields not yet checked against the publisher record.',
    },
    pt: {
      'prior.readout': '{k} das {r} coordenadas latentes são compartilhadas. Correlação média entre os dois campos no mesmo ponto, segundo o prior: {rho}.',
      'prior.scatterAria': 'Valor do campo 2 contra o campo 1 em cada um dos 256 pontos do par sorteado',
      'prior.x': 'campo 1',
      'prior.y': 'campo 2',

      'attr.none': 'Nenhuma fonte',
      'attr.O': 'Só o operador',
      'attr.P': 'Só o prior',
      'attr.OP': 'As duas (o que se vê)',
      'attr.cellValue': 'ρ médio = {v}',
      'attr.cellMI': 'I = {v} nats',
      'attr.sharesAria': 'Parcelas de Shapley do operador e do prior, e a soma delas',
      'attr.phiO': 'φ operador',
      'attr.phiP': 'φ prior',
      'attr.total': 'total',
      'attr.survival': 'Sozinho, o prior põe uma correlação média de {prior} entre os campos. Com estes dados e o prior como única fonte, a posterior guarda {post}, ou seja, {pct}% disso.',
      'attr.oppose': 'As duas fontes puxam em sentidos opostos: o operador empurra a dependência para {dirO}, o prior para {dirP}. O mapa final mostra só o saldo, {total}.',
      'attr.up': 'cima',
      'attr.down': 'baixo',
      'attr.miNegative': 'Com a informação mútua, a parcela do prior sai negativa aqui: uma medida sem sinal não distingue "duas forças se cancelando" de "o prior tirando dependência".',
      'attr.unsigned': 'A medida sem sinal conta dependência negativa e positiva do mesmo jeito, então fontes opostas se somam em vez de se cancelar.',
      'attr.computing': 'Calculando as quatro posteriores exatas…',
      'attr.done': 'Quatro posteriores exatas, {ms} ms no seu navegador.',

      'samp.aria': 'Estimativas repetidas da correlação média a partir de amostras, contra o valor exato',
      'samp.exact': 'exato',
      'samp.biasedTarget': 'para onde o amostrador torto converge',
      'samp.readout': '{R} estimativas repetidas com {S} amostras cada. Média das estimativas: {mean}; valor exato: {exact}; dispersão (DP): {sd}.',
      'samp.biasNote': ' O amostrador torto erra por {gap}, não importa quantas amostras sorteie.',
      'samp.computing': 'Sorteando amostras…',
      'samp.x': 'correlação média estimada',

      'res.magAria': 'Erro de magnitude da previsão da substituta nos oito pontos confirmatórios, contra a tolerância de 4,5%',
      'res.tol': 'tolerância {tol}%',
      'res.weak': 'dependência fraca no prior (s = 0,25)',
      'res.strong': 'dependência forte no prior (s = 0,75)',
      'res.point': 'κ = {kappa}',
      'res.informative': 'informativos',
      'res.lowinfo': 'fracos',
      'res.verdict': 'Ordem: τ = {tauO} para o operador e {tauP} para o prior (limiares {attO} e {attP}): {rank}. Magnitude: pior erro {maxErr}% contra uma tolerância de {tol}%: {mag}. Resultado pela regra registrada antes dos runs: {outcome}.',
      'res.pass': 'passa',
      'res.fail': 'não passa',
      'res.outcome.REFUTED': 'H1 refutada',
      'res.outcome.SUPPORTED': 'H1 sustentada',
      'res.outcome.INDETERMINATE': 'indeterminado',

      'f1.aria': 'Perda de dependência entre campos da rede treinada ao longo do treino, média de 4 redes com faixa de mínimo a máximo',
      'f1.x': 'passos de treino',
      'f1.y': 'dependência perdida (%)',
      'f1.main': 'teste principal',
      'f1.thousand': '{n} mil',
      'f1.series': 's = {s}, N = {N}',
      'f1.verdictE': 'erosão sustentada (4 de 4 redes perdem mais em 160 mil do que em 20 mil)',
      'f1.verdictI': 'indeterminado ({up} de {n} redes com perda maior em 160 mil)',

      'ref.unverified': 'Campos bibliográficos ainda não conferidos com o registro da editora.',
    },
  };

  const lang = /^pt/i.test(document.documentElement.lang) ? 'pt' : 'en';
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

  function t(key, vars) {
    const template = STRINGS[lang][key] !== undefined ? STRINGS[lang][key] : STRINGS.en[key];
    if (template === undefined) throw new Error('missing string: ' + key);
    return template.replace(/\{(\w+)\}/g, function (all, name) {
      return vars && vars[name] !== undefined ? String(vars[name]) : all;
    });
  }

  // Locale-aware fixed-digit number (decimal comma in Portuguese).
  // trim=true drops trailing zeros (0.5 rather than 0.500).
  function num(value, digits, trim) {
    return Number(value).toLocaleString(locale, { minimumFractionDigits: trim ? 0 : digits || 0, maximumFractionDigits: digits || 0 });
  }

  // Keep the reader's place when switching language: carry the #section over.
  document.querySelectorAll('[data-lang-switch] a').forEach(function (link) {
    link.addEventListener('click', function () {
      link.setAttribute('href', link.getAttribute('href').split('#')[0] + window.location.hash);
    });
  });

  root.AE = root.AE || {};
  root.AE.i18n = { lang: lang, t: t, num: num, STRINGS: STRINGS };
})(globalThis);
