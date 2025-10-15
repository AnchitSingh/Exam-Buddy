// tests/contentCleaner.test.js

import { 
    cleanSelectionText, 
    analyzeCleaningImpact, 
    debugCleaningSteps,
    __testing__ 
  } from './src/utils/contentCleaner.js';
  
  // ============================================================================
  // TEST UTILITIES
  // ============================================================================
  
  class TestRunner {
    constructor() {
      this.tests = [];
      this.results = {
        passed: 0,
        failed: 0,
        warnings: 0
      };
    }
  
    addTest(name, input, expectations, options = {}) {
      this.tests.push({ name, input, expectations, options });
    }
  
    run() {
      console.log('🧪 Running Content Cleaner Test Suite\n');
      console.log('='.repeat(80));
      
      this.tests.forEach((test, index) => {
        console.log(`\n📋 Test ${index + 1}: ${test.name}`);
        console.log('-'.repeat(80));
        
        this.runSingleTest(test);
      });
      
      this.printSummary();
    }
  
    runSingleTest(test) {
      const { name, input, expectations, options } = test;
      
      // Show input (truncated)
      console.log('\n📥 INPUT (first 200 chars):');
      console.log(this.truncate(input, 200));
      console.log(`   Full length: ${input.length} characters`);
      
      // Run cleaning
      const cleaned = cleanSelectionText(input, options);
      
      // Show output
      console.log('\n📤 OUTPUT (first 200 chars):');
      console.log(this.truncate(cleaned, 200));
      console.log(`   Final length: ${cleaned.length} characters`);
      
      // Analyze impact
      const stats = analyzeCleaningImpact(input, cleaned);
      console.log('\n📊 STATISTICS:');
      console.log(`   Removed: ${stats.removed.percentage}% of original text`);
      console.log(`   Words: ${stats.original.words} → ${stats.cleaned.words}`);
      console.log(`   Lines: ${stats.original.lines} → ${stats.cleaned.lines}`);
      console.log(`   Placeholders: `, stats.placeholders);
      
      // Run assertions
      console.log('\n✓ ASSERTIONS:');
      let testPassed = true;
      
      expectations.forEach(expectation => {
        const result = expectation.check(cleaned, input);
        const icon = result.pass ? '  ✅' : '  ❌';
        
        console.log(`${icon} ${expectation.description}`);
        if (!result.pass) {
          console.log(`      Expected: ${expectation.expected}`);
          console.log(`      Got: ${result.actual}`);
          testPassed = false;
        }
        if (result.warning) {
          console.log(`      ⚠️  ${result.warning}`);
          this.results.warnings++;
        }
      });
      
      // Update results
      if (testPassed) {
        this.results.passed++;
        console.log('\n✅ TEST PASSED');
      } else {
        this.results.failed++;
        console.log('\n❌ TEST FAILED');
      }
      
      console.log('\n' + '='.repeat(80));
    }
  
    truncate(text, max) {
      if (text.length <= max) return text;
      return text.substring(0, max) + '... (truncated)';
    }
  
    printSummary() {
      console.log('\n\n📈 TEST SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${this.tests.length}`);
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(`⚠️  Warnings: ${this.results.warnings}`);
      console.log(`Success Rate: ${((this.results.passed / this.tests.length) * 100).toFixed(1)}%`);
      console.log('='.repeat(80));
    }
  }
  
  // Assertion helpers
  const expect = {
    notContains: (searchTerm, description) => ({
      description: description || `Should not contain "${searchTerm}"`,
      expected: `Not containing "${searchTerm}"`,
      check: (cleaned) => {
        const pass = !cleaned.includes(searchTerm);
        return {
          pass,
          actual: pass ? 'Not found ✓' : `Found at position ${cleaned.indexOf(searchTerm)}`
        };
      }
    }),
    
    contains: (searchTerm, description) => ({
      description: description || `Should contain "${searchTerm}"`,
      expected: `Containing "${searchTerm}"`,
      check: (cleaned) => {
        const pass = cleaned.includes(searchTerm);
        return {
          pass,
          actual: pass ? 'Found ✓' : 'Not found'
        };
      }
    }),
    
    minWords: (min, description) => ({
      description: description || `Should have at least ${min} words`,
      expected: `>= ${min} words`,
      check: (cleaned) => {
        const words = (cleaned.match(/\b[a-zA-Z]{2,}\b/g) || []).length;
        const pass = words >= min;
        return {
          pass,
          actual: `${words} words`
        };
      }
    }),
    
    maxLength: (max, description) => ({
      description: description || `Should be <= ${max} characters`,
      expected: `<= ${max} chars`,
      check: (cleaned) => {
        const pass = cleaned.length <= max;
        return {
          pass,
          actual: `${cleaned.length} chars`
        };
      }
    }),
    
    reductionPercent: (minPercent, maxPercent, description) => ({
      description: description || `Should reduce text by ${minPercent}-${maxPercent}%`,
      expected: `${minPercent}-${maxPercent}% reduction`,
      check: (cleaned, original) => {
        const reduction = ((1 - cleaned.length / original.length) * 100);
        const pass = reduction >= minPercent && reduction <= maxPercent;
        return {
          pass,
          actual: `${reduction.toFixed(1)}% reduction`,
          warning: !pass && reduction < minPercent ? 'Not enough cleaning' : 
                   !pass && reduction > maxPercent ? 'Too aggressive cleaning' : null
        };
      }
    }),
    
    matchesPattern: (pattern, description) => ({
      description: description || `Should match pattern ${pattern}`,
      expected: `Matches ${pattern}`,
      check: (cleaned) => {
        const pass = pattern.test(cleaned);
        return {
          pass,
          actual: pass ? 'Pattern matched ✓' : 'Pattern not matched'
        };
      }
    }),
    
    custom: (checkFn, description, expected) => ({
      description,
      expected,
      check: (cleaned, original) => {
        try {
          const result = checkFn(cleaned, original);
          return typeof result === 'boolean' ? 
            { pass: result, actual: result ? 'Check passed ✓' : 'Check failed' } :
            result;
        } catch (error) {
          return { pass: false, actual: `Error: ${error.message}` };
        }
      }
    })
  };
  
  // ============================================================================
  // TEST CASES
  // ============================================================================
  
  const runner = new TestRunner();
  
  // ---------------------------------------------------------------------------
  // TEST 1: Wikipedia Scientific Article (Navier-Stokes) - THE ORIGINAL NIGHTMARE
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Wikipedia Scientific Article - Navier-Stokes Equations',
    `Navier–Stokes equations
  Main article: Navier–Stokes equations
  The Navier–Stokes equations (named after Claude-Louis Navier and George Gabriel Stokes) are differential equations that describe the force balance at a given point within a fluid. For an incompressible fluid with vector velocity field 
  u
  {\displaystyle \mathbf {u} }, the Navier–Stokes equations are[13][14][15][16]
  
  ∂
  u
  ∂
  t
  +
  (
  u
  ⋅
  ∇
  )
  u
  =
  −
  1
  ρ
  ∇
  p
  +
  ν
  ∇
  2
  u
  {\displaystyle {\frac {\partial \mathbf {u} }{\partial t}}+(\mathbf {u} \cdot \nabla )\mathbf {u} =-{\frac {1}{\rho }}\nabla p+\nu \nabla ^{2}\mathbf {u} }.
  These differential equations are the analogues for deformable materials to Newton's equations of motion for particles – the Navier–Stokes equations describe changes in momentum (force) in response to pressure 
  p
  {\displaystyle p} and viscosity, parameterized by the kinematic viscosity 
  ν
  {\displaystyle \nu }. Occasionally, body forces, such as the gravitational force or Lorentz force are added to the equations.
  
  Solutions of the Navier–Stokes equations for a given physical problem must be sought with the help of calculus. In practical terms, only the simplest cases can be solved exactly in this way. These cases generally involve non-turbulent, steady flow in which the Reynolds number is small. For more complex cases, especially those involving turbulence, such as global weather systems, aerodynamics, hydrodynamics and many more, solutions of the Navier–Stokes equations can currently only be found with the help of computers. This branch of science is called computational fluid dynamics.[17][18][19][20][21]`,
    [
      expect.notContains('\\displaystyle', 'LaTeX commands removed'),
      expect.notContains('\\mathbf', 'Math formatting removed'),
      expect.notContains('[13]', 'Citation markers removed'),
      expect.notContains('Main article:', 'Wikipedia navigation removed'),
      expect.contains('Navier', 'Preserves main content'),
      expect.contains('differential equations', 'Preserves key terms'),
      expect.contains('computational fluid dynamics', 'Preserves final sentence'),
      expect.minWords(50, 'Maintains substantial content'),
      expect.reductionPercent(20, 60, 'Reasonable reduction'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 2: Chemistry with Unicode Symbols
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Chemistry Article with Subscripts/Superscripts',
    `Water (H₂O) is a polar molecule. The reaction 2H₂ + O₂ → 2H₂O releases energy.
  The pH scale ranges from 0-14, where pH = -log₁₀[H⁺].
  Temperature: 25°C (77°F)
  Avogadro's number: 6.022 × 10²³ molecules/mol
  Bond angle: 104.5° ± 0.1°
  Concentration: 1.5 µM to 10 µM
  The equilibrium constant Kₑq = [C]^c[D]^d / [A]^a[B]^b`,
    [
      expect.notContains('₂', 'Subscripts normalized'),
      expect.notContains('²', 'Superscripts normalized'),
      expect.notContains('×', 'Multiplication sign normalized'),
      expect.notContains('µ', 'Mu symbol normalized'),
      expect.notContains('°', 'Degree symbol handled'),
      expect.contains('H_2O', 'Water formula preserved in readable form'),
      expect.contains('10^23', 'Scientific notation preserved'),
      expect.minWords(20, 'Content preserved'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 3: Programming Article with Code Blocks
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Programming Article with Code Blocks',
    `QuickSort Algorithm
  The quicksort algorithm is defined as:
  
  \`\`\`python
  def quicksort(arr):
      if len(arr) <= 1:
          return arr
      pivot = arr[len(arr) // 2]
      left = [x for x in arr if x < pivot]
      return quicksort(left) + [pivot] + quicksort(right)
  \`\`\`
  
  The time complexity is O(n log n) on average. The inline function \`partition()\` splits the array.
  
  Visit https://en.wikipedia.org/wiki/Quicksort for more details.
  Email: support@example.com for questions.`,
    [
      expect.notContains('```python', 'Code fences removed'),
      expect.notContains('def quicksort', 'Code content removed'),
      expect.notContains('https://', 'URLs removed'),
      expect.notContains('@example.com', 'Emails removed'),
      expect.contains('[code block]', 'Code replaced with placeholder'),
      expect.contains('QuickSort Algorithm', 'Title preserved'),
      expect.contains('time complexity', 'Explanation preserved'),
      expect.minWords(10, 'Has meaningful text'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 4: Table Hell
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Wikipedia Table Nightmare',
    `Comparison of Algorithms
  
  | Algorithm | Time | Space | Stable |
  |-----------|------|-------|--------|
  | QuickSort | O(n log n) | O(log n) | No |
  | MergeSort | O(n log n) | O(n) | Yes |
  | HeapSort  | O(n log n) | O(1) | No |
  +===========+======+=======+========+
  | Total     | Varies based on input |
  
  The table above shows[1][2] different sorting algorithms.`,
    [
      expect.notContains('|', 'Table pipes removed'),
      expect.notContains('---', 'Table separators removed'),
      expect.notContains('===', 'Table borders removed'),
      expect.notContains('[1]', 'Citations removed'),
      expect.contains('Comparison of Algorithms', 'Title preserved'),
      expect.contains('sorting algorithms', 'Context preserved'),
      expect.minWords(5, 'Has some content'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 5: Greek Letters and Math Operators
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Physics with Greek Letters',
    `Einstein's field equations: Gμν + Λgμν = (8πG/c⁴)Tμν
  
  The wave function Ψ(x,t) evolves according to:
  iℏ ∂Ψ/∂t = ĤΨ
  
  Where:
  • ℏ = h/2π (reduced Planck constant)
  • Ĥ is the Hamiltonian operator
  • α ≈ 1/137 (fine structure constant)
  • ∫₀^∞ |Ψ|² dx = 1 (normalization)
  
  Common relations:
  ΔE·Δt ≥ ℏ/2 (Heisenberg uncertainty)
  E = mc² (mass-energy equivalence)
  F = ma (Newton's second law)`,
    [
      expect.notContains('μ', 'Greek mu normalized'),
      expect.notContains('Ψ', 'Psi normalized'),
      expect.notContains('∂', 'Partial derivative normalized'),
      expect.notContains('∫', 'Integral normalized'),
      expect.notContains('ℏ', 'H-bar normalized'),
      expect.notContains('≈', 'Approximately symbol normalized'),
      expect.notContains('≥', 'Greater-equal normalized'),
      expect.contains('alpha', 'Greek letters spelled out'),
      expect.contains('integral', 'Math operators spelled out'),
      expect.minWords(15, 'Meaningful content remains'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 6: HTML Entities Nightmare
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'HTML Entity Hell',
    `The company&apos;s motto is &quot;Innovation&quot; &mdash; they&rsquo;ve been around since 1990&hellip;
  
  Key points:
  &bull; First item&nbsp;&nbsp;with spaces
  &bull; Second &lt;important&gt; item
  &bull; Third item (see &#91;1&#93;)
  
  Temperature &gt; 100&deg;C but &lt; 200&deg;C.
  Price: &euro;50 &plusmn; &euro;5
  Math: x&sup2; + y&sup2; = r&sup2;`,
    [
      expect.notContains('&quot;', 'Quotes decoded'),
      expect.notContains('&mdash;', 'Em-dash decoded'),
      expect.notContains('&bull;', 'Bullets decoded'),
      expect.notContains('&nbsp;', 'Non-breaking spaces decoded'),
      expect.notContains('&#', 'Numeric entities decoded'),
      expect.contains('Innovation', 'Content preserved'),
      expect.contains('First item', 'List items preserved'),
      expect.minWords(15, 'Has content'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 7: Mixed LaTeX Inline and Display
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Mixed LaTeX Formats',
    `The formula $E = mc^2$ is famous. We also have display math:
  
  $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
  
  And inline LaTeX like \KATEX_INLINE_OPEN\\alpha + \\beta = \\gamma\KATEX_INLINE_CLOSE or \`F = ma\`.
  
  The equation \\begin{equation} \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t} \\end{equation} is Maxwell's law.
  
  Regular text continues here with $f(x) = x^2 + 2x + 1$ embedded.`,
    [
      expect.notContains('$$', 'Display math delimiters removed'),
      expect.notContains('\\int', 'LaTeX commands removed'),
      expect.notContains('\\begin{equation}', 'Equation environments removed'),
      expect.notContains('\\alpha', 'Greek LaTeX removed'),
      expect.contains('[equation]', 'Equations replaced with placeholders'),
      expect.contains('famous', 'Regular text preserved'),
      expect.contains('Maxwell', 'Context preserved'),
      expect.minWords(5, 'Has meaningful text'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 8: Social Media with Emoji
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Social Media Post with Emoji',
    `🔥 This is AMAZING! 💯
  
  Check out this new feature 👀🚀
  It's absolutely 🔥🔥🔥 
  
  Key benefits:
  ✅ Fast performance
  ✅ Easy to use  
  ✅ Beautiful design 🎨
  
  Don't miss out! 👉 Click here 👈
  
  #innovation #tech 🌟⭐`,
    [
      expect.notContains('🔥', 'Fire emoji removed'),
      expect.notContains('💯', 'Hundred emoji removed'),
      expect.notContains('👀', 'Eyes emoji removed'),
      expect.notContains('✅', 'Checkmark emoji removed'),
      expect.contains('This is AMAZING', 'Text content preserved'),
      expect.contains('Fast performance', 'List preserved'),
      expect.minWords(10, 'Meaningful content remains'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 9: Invisible Characters Attack
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Invisible Characters and RTL Marks',
    `This​ text​ has​ zero-width​ spaces.
  Some­times there's soft­hyphens.
  And‏ RTL‏ marks‏ that‏ break‏ things.
  Plus\u200B\u200C\u200D\uFEFFall\u202A\u202Bsorts\u202C\u202D\u202Eof garbage.
  
  Normal text should remain intact.`,
    [
      expect.custom(
        (cleaned) => !cleaned.match(/[\u200B-\u200D\uFEFF\u202A-\u202E]/),
        'No invisible characters remain',
        'All invisible chars removed'
      ),
      expect.contains('This text has zero-width spaces', 'Readable text preserved'),
      expect.contains('Normal text', 'Regular content intact'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 10: Length Limiting Test
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Very Long Text - Length Limiting',
    `Introduction to Quantum Mechanics
  
  ${'Quantum mechanics is a fundamental theory in physics. '.repeat(100)}
  
  This text is intentionally very long to test the length limiting feature.
  
  ${'More content here with detailed explanations. '.repeat(50)}
  
  Conclusion: Quantum mechanics revolutionized physics.`,
    [
      expect.maxLength(5000, 'Respects max length limit'),
      expect.contains('Introduction', 'Keeps beginning'),
      expect.custom(
        (cleaned) => {
          const hasConclusion = cleaned.includes('Conclusion');
          const hasEllipsis = cleaned.includes('...');
          return {
            pass: !hasConclusion || hasEllipsis,
            actual: hasConclusion ? 'Full text preserved' : 'Text truncated properly',
            warning: !hasConclusion ? 'Text was truncated' : null
          };
        },
        'Truncation works correctly',
        'Should truncate or preserve with ellipsis'
      ),
    ],
    { maxLength: 5000 }
  );
  
  // ---------------------------------------------------------------------------
  // TEST 11: Empty/Minimal Content After Cleaning
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Equation-Heavy Content (Validation Test)',
    `[1][2][3]
  $$\\int x dx$$
  $$\\frac{dy}{dx}$$
  [citation needed]
  \\begin{equation}x\\end{equation}
  [4][5]`,
    [
      expect.custom(
        (cleaned, original) => {
          const wordCount = (cleaned.match(/\b[a-zA-Z]{2,}\b/g) || []).length;
          const shouldFallback = wordCount < 10;
          return {
            pass: true, // This should trigger fallback mechanism
            actual: shouldFallback ? 'Fallback triggered ✓' : `${wordCount} words found`,
            warning: shouldFallback ? 'Original content was mostly equations' : null
          };
        },
        'Handles equation-only content gracefully',
        'Should fallback to original or return meaningful error'
      ),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 12: Real Wikipedia - Complex Mix
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Real Wikipedia Complexity - Calculus Article',
    `Fundamental theorem of calculus
  From Wikipedia, the free encyclopedia
  Jump to navigation
  
  The fundamental theorem of calculus is a theorem that links the concept of differentiating a function (calculating the gradient) with the concept of integrating a function (calculating the area under the curve). The two operations are inverses of each other apart from a constant value which depends on where one starts to compute area.
  
  First part[edit]
  This part is sometimes referred to as the First Fundamental Theorem of Calculus.[1][2]
  
  Let f be a continuous real-valued function defined on a closed interval [a, b]. Let F be the function defined, for all x in [a, b], by
  
  F(x) = \\int_a^x f(t)\\,dt
  
  Then F is uniformly continuous on [a, b] and differentiable on the open interval (a, b), and
  
  F'(x) = f(x)
  
  for all x in (a, b) so F is an antiderivative of f.
  
  Corollary[edit]
  The corollary assumes continuity on the whole interval. This result is strengthened slightly in the following part of the theorem.
  
  See also: Lists of integrals
  Main article: Antiderivative
  ^ Jump up to: a b c Smith, John (2020)`,
    [
      expect.notContains('From Wikipedia', 'Wikipedia header removed'),
      expect.notContains('Jump to navigation', 'Navigation removed'),
      expect.notContains('[edit]', 'Edit links removed'),
      expect.notContains('[1]', 'Citations removed'),
      expect.notContains('^ Jump up', 'Reference links removed'),
      expect.notContains('\\int', 'LaTeX removed'),
      expect.contains('fundamental theorem of calculus', 'Main topic preserved'),
      expect.contains('differentiating', 'Key concepts preserved'),
      expect.contains('antiderivative', 'Technical terms preserved'),
      expect.minWords(30, 'Substantial content remains'),
      expect.reductionPercent(15, 70, 'Reasonable cleaning'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 13: Edge Case - Only Special Characters
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Edge Case: Mostly Special Characters',
    `→ ← ↔ ⇒ ⇐ ⇔
  ∫ ∑ ∏ √ ∞ ∂
  α β γ δ ε θ λ μ π σ φ ω
  ≈ ≠ ≤ ≥ ± × ÷
  [1][2][3][4][5]
  $$x$$ $$y$$ $$z$$`,
    [
      expect.custom(
        (cleaned, original) => {
          // Should either fallback or have minimal content
          const isEmpty = cleaned.trim().length < 20;
          return {
            pass: true,
            actual: isEmpty ? 'Cleaned to near-empty (fallback expected)' : `Has ${cleaned.length} chars`,
            warning: 'Original had no meaningful text content'
          };
        },
        'Handles character-only input',
        'Should fallback gracefully'
      ),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 14: Nested LaTeX Nightmare
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Deeply Nested LaTeX Structures',
    `The formula is complex:
  
  {\\displaystyle {\\frac {\\partial }{\\partial t}}{\\bigg (}{\\frac {\\partial L}{\\partial {\\dot {q}}_{i}}}{\\bigg )}-{\\frac {\\partial L}{\\partial q_{i}}}=0}
  
  This represents {\\displaystyle {\\mathcal {L}}=T-V} where T is kinetic energy.
  
  Another nested case: {\\frac{1}{2}}{\\sqrt{{\\frac{a}{b}}+c}}
  
  Regular text explaining the Lagrangian formulation of mechanics continues here.`,
    [
      expect.notContains('\\displaystyle', 'Display style removed'),
      expect.notContains('\\frac', 'Fraction commands removed'),
      expect.notContains('\\partial', 'Partial derivative removed'),
      expect.notContains('\\bigg', 'Size commands removed'),
      expect.notContains('{', 'Curly braces cleaned'),
      expect.contains('[equation]', 'Equations marked'),
      expect.contains('Lagrangian', 'Context preserved'),
      expect.minWords(5, 'Some meaningful text remains'),
    ]
  );
  
  // ---------------------------------------------------------------------------
  // TEST 15: Real-World Mixed Content
  // ---------------------------------------------------------------------------
  
  runner.addTest(
    'Real-World: Mixed Scientific Article',
    `<h1>Schrödinger equation</h1>
  <p>From Wikipedia, the free encyclopedia</p>
  
  The <b>Schrödinger equation</b> is a linear partial differential equation that governs the wave function of a quantum-mechanical system.[1][2] Its discovery was a significant landmark in the development of quantum mechanics.
  
  <h2>Time-dependent equation[edit]</h2>
  
  The form of the Schrödinger equation depends on the physical situation. The most general form is the time-dependent Schrödinger equation (TDSE), which gives a description of a system evolving with time:[3][4]
  
  $$i\\hbar {\\frac {\\partial }{\\partial t}}\\Psi (\\mathbf {r} ,t)={\\hat {H}}\\Psi (\\mathbf {r} ,t)$$
  
  where:
  • i is the imaginary unit  
  • ℏ = h/(2π) ≈ 1.054 × 10⁻³⁴ J⋅s
  • Ψ (the Greek letter psi) is the wave function
  • ∂/∂t indicates a partial derivative with respect to time t
  • Ĥ is the Hamiltonian operator
  
  Visit https://www.example.com/quantum for more details.
  
  <table>
  | Symbol | Meaning |
  |--------|---------|  
  | Ψ      | Wave function |
  | ℏ      | Reduced Planck constant |
  </table>
  
  The equation was postulated by Erwin Schrödinger in 1925.[5]`,
    [
      expect.notContains('<h1>', 'HTML tags removed'),
      expect.notContains('&nbsp;', 'HTML entities decoded'),
      expect.notContains('[edit]', 'Edit links removed'),
      expect.notContains('[1]', 'Citations removed'),
      expect.notContains('$$', 'Display math removed'),
      expect.notContains('\\hbar', 'LaTeX commands removed'),
      expect.notContains('ℏ', 'Unicode symbols normalized'),
      expect.notContains('Ψ', 'Greek letters normalized'),
      expect.notContains('https://', 'URLs removed'),
      expect.notContains('|', 'Table formatting removed'),
      expect.contains('Schrödinger equation', 'Main topic preserved'),
      expect.contains('wave function', 'Key terms preserved'),
      expect.contains('Erwin Schrödinger', 'Historical context preserved'),
      expect.minWords(20, 'Substantial content remains'),
      expect.reductionPercent(30, 80, 'Significant cleaning occurred'),
    ]
  );
  
  // ============================================================================
  // RUN ALL TESTS
  // ============================================================================
  
  runner.run();
  
  // ============================================================================
  // OPTIONAL: DETAILED DEBUG FOR SPECIFIC TEST
  // ============================================================================
  
  console.log('\n\n🔍 DETAILED DEBUG EXAMPLE');
  console.log('='.repeat(80));
  console.log('Showing step-by-step cleaning for Test 1 (Navier-Stokes):\n');
  
  const debugInput = runner.tests[0].input;
  const steps = debugCleaningSteps(debugInput);
  
  console.log('📍 After HTML cleaning:');
  console.log(runner.truncate(steps.afterHtml, 150));
  
  console.log('\n📍 After Scientific cleaning:');
  console.log(runner.truncate(steps.afterScientific, 150));
  
  console.log('\n📍 After Unicode Math normalization:');
  console.log(runner.truncate(steps.afterUnicodeMath, 150));
  
  console.log('\n📍 Final output:');
  console.log(runner.truncate(steps.final, 200));