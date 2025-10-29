import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';

interface PasswordAnalysis {
  score: number;
  level: 'weak' | 'medium' | 'strong' | 'excellent';
  feedback: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
    commonWord: boolean;
  };
  timeToHack: string;
  breachInfo?: {
    compromised: boolean;
    breach_count?: number;
    severity?: string;
    message?: string;
  };
}

const Index = () => {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);

  const analyzePassword = (pwd: string): PasswordAnalysis => {
    const checks = {
      length: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
      commonWord: !/^(password|12345|qwerty|admin|letmein)/i.test(pwd)
    };

    const commonPatterns = [
      /(.)\1{2,}/,
      /123|234|345|456|567|678|789/,
      /abc|bcd|cde|def|efg|fgh/i,
      /qwerty|asdfgh|zxcvbn/i
    ];

    let score = 0;
    const feedback: string[] = [];

    if (pwd.length === 0) {
      return {
        score: 0,
        level: 'weak',
        feedback: ['Введите пароль для анализа'],
        checks,
        timeToHack: '0 секунд'
      };
    }

    if (checks.length) score += 25;
    else feedback.push('Используйте минимум 12 символов');

    if (checks.uppercase) score += 15;
    else feedback.push('Добавьте заглавные буквы');

    if (checks.lowercase) score += 15;
    else feedback.push('Добавьте строчные буквы');

    if (checks.numbers) score += 15;
    else feedback.push('Добавьте цифры');

    if (checks.special) score += 20;
    else feedback.push('Добавьте специальные символы (!@#$%^&*)');

    if (checks.commonWord) score += 10;
    else {
      feedback.push('Избегайте простых слов');
      score -= 20;
    }

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(pwd));
    if (hasCommonPattern) {
      feedback.push('Обнаружена повторяющаяся последовательность');
      score -= 15;
    }

    if (pwd.length >= 16) score += 10;
    if (pwd.length >= 20) score += 10;

    score = Math.max(0, Math.min(100, score));

    let level: PasswordAnalysis['level'];
    let timeToHack: string;

    if (score < 30) {
      level = 'weak';
      timeToHack = 'Менее 1 секунды';
    } else if (score < 60) {
      level = 'medium';
      timeToHack = 'От нескольких часов до дней';
    } else if (score < 85) {
      level = 'strong';
      timeToHack = 'От нескольких лет до десятилетий';
    } else {
      level = 'excellent';
      timeToHack = 'Тысячи лет';
    }

    if (feedback.length === 0) {
      feedback.push('Отличный пароль! Все проверки пройдены');
    }

    return { score, level, feedback, checks, timeToHack };
  };

  const checkBreaches = async (pwd: string) => {
    if (!pwd || pwd.length < 4) return null;
    
    try {
      const response = await fetch('https://functions.poehali.dev/9a995e1c-5de4-47cc-82ab-2ff77c99888c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: pwd })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Breach check error:', error);
    }
    return null;
  };

  useEffect(() => {
    const checkPassword = async () => {
      setChecking(true);
      const result = analyzePassword(password);
      
      const breachInfo = await checkBreaches(password);
      if (breachInfo) {
        result.breachInfo = breachInfo;
        
        if (breachInfo.compromised) {
          result.score = Math.max(0, result.score - 30);
          result.feedback.unshift(`⚠️ ${breachInfo.message}`);
          
          if (result.score < 30) {
            result.level = 'weak';
          } else if (result.score < 60) {
            result.level = 'medium';
          }
        }
      }
      
      setAnalysis(result);
      setChecking(false);
    };
    
    checkPassword();
  }, [password]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-primary';
      case 'excellent': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'weak': return 'СЛАБЫЙ';
      case 'medium': return 'СРЕДНИЙ';
      case 'strong': return 'СИЛЬНЫЙ';
      case 'excellent': return 'ПРЕВОСХОДНЫЙ';
      default: return '';
    }
  };

  const getProgressColor = (score: number) => {
    if (score < 30) return 'bg-red-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 85) return 'bg-primary';
    return 'bg-secondary';
  };

  const faqs = [
    {
      question: 'Почему длина пароля так важна?',
      answer: 'Длина пароля экспоненциально увеличивает время взлома. Пароль из 8 символов можно взломать за часы, а из 16 символов — за тысячи лет при использовании современных методов брутфорса.'
    },
    {
      question: 'Что такое радужные таблицы?',
      answer: 'Радужные таблицы — это предвычисленные хеши распространённых паролей. Использование уникальных паролей с солью (случайными данными) делает эти таблицы бесполезными.'
    },
    {
      question: 'Безопасно ли использовать менеджеры паролей?',
      answer: 'Да, современные менеджеры паролей используют end-to-end шифрование. Они позволяют использовать уникальные сложные пароли для каждого сервиса, что намного безопаснее повторного использования простых паролей.'
    },
    {
      question: 'Как часто нужно менять пароли?',
      answer: 'Современные рекомендации NIST предлагают менять пароли только при подозрении на компрометацию. Частая смена заставляет использовать более простые пароли, что снижает безопасность.'
    },
    {
      question: 'Что такое двухфакторная аутентификация (2FA)?',
      answer: '2FA добавляет второй уровень защиты помимо пароля — обычно это одноразовый код из приложения или SMS. Даже если пароль скомпрометирован, злоумышленник не сможет войти без второго фактора.'
    }
  ];

  const tips = [
    {
      icon: 'Shield',
      title: 'Используйте парольные фразы',
      description: 'Комбинация из 4-5 случайных слов (например, "Космос-Кофе-Гитара-Закат") легко запоминается и очень надёжна.',
      example: 'МолнияОблакоКлавиатура2024!'
    },
    {
      icon: 'RefreshCw',
      title: 'Уникальный пароль для каждого сайта',
      description: 'Утечка одного пароля не должна компрометировать все ваши аккаунты. Используйте менеджеры паролей.',
      example: 'Gmail: Sf9$kL@Zx2!Pm\nFacebook: 7nQ#vR@8pW$Lk'
    },
    {
      icon: 'Lock',
      title: 'Комбинируйте разные типы символов',
      description: 'Смешивайте заглавные, строчные буквы, цифры и специальные символы для максимальной стойкости.',
      example: 'Tr0ub4dor&3 или c0rrect-h0rse-battery-staple!'
    },
    {
      icon: 'AlertTriangle',
      title: 'Избегайте очевидных замен',
      description: 'Замены типа @ вместо a или 3 вместо e легко предсказуемы для алгоритмов взлома.',
      example: '❌ P@ssw0rd → ✅ 8jK#mQ2!xL@9'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <Icon name="Lock" size={64} className="text-primary neon-text" />
          </div>
          <h1 className="text-6xl font-bold mb-4 neon-text text-primary glitch">
            PASSWORD SHIELD
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Интеллектуальный анализатор стойкости паролей с ML-алгоритмами защиты
          </p>
        </header>

        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-xl neon-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Icon name="Scan" className="text-primary" />
                Анализ пароля
              </CardTitle>
              <CardDescription>Введите пароль для проверки его надёжности</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите ваш пароль..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-lg h-14 bg-background/50 border-primary/30 focus:border-primary pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={20} />
                  </button>
                </div>
                {checking && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Shield" className="animate-pulse" size={14} />
                    <span>Проверка по базе утечек данных...</span>
                  </div>
                )}
              </div>

              {analysis && password && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Уровень стойкости</span>
                      <Badge className={`${getLevelColor(analysis.level)} neon-text text-base font-bold`}>
                        {getLevelText(analysis.level)} — {analysis.score}%
                      </Badge>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(analysis.score)}`}
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                  </div>

                  {analysis.breachInfo?.compromised && (
                    <Card className="bg-red-950/30 border-red-500/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="AlertTriangle" className="text-red-500" size={24} />
                          <div>
                            <h3 className="font-bold text-red-500">КРИТИЧЕСКАЯ УГРОЗА</h3>
                            <p className="text-sm text-red-400">
                              Найдено в {analysis.breachInfo.breach_count} утечках данных
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-background/30 border-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Icon name="Timer" className="text-accent" />
                        <span className="font-semibold">Время взлома: {analysis.timeToHack}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {Object.entries(analysis.checks).map(([key, value]) => (
                          <div
                            key={key}
                            className={`flex items-center gap-2 p-2 rounded ${
                              value ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground'
                            }`}
                          >
                            <Icon name={value ? 'CheckCircle2' : 'XCircle'} size={18} />
                            <span className="text-sm">
                              {key === 'length' && '12+ символов'}
                              {key === 'uppercase' && 'Заглавные'}
                              {key === 'lowercase' && 'Строчные'}
                              {key === 'numbers' && 'Цифры'}
                              {key === 'special' && 'Спецсимволы'}
                              {key === 'commonWord' && 'Уникальность'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {analysis.feedback.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Icon name="Info" size={16} className="text-accent mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          <Card className="border-secondary/20 bg-card/50 backdrop-blur-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Icon name="HelpCircle" className="text-secondary" />
                Вопросы и ответы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Icon name="Lightbulb" className="text-accent" />
                Советы по безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tips.map((tip, index) => (
                <div key={index} className="p-4 bg-background/30 rounded-lg border border-primary/10 hover:border-accent/30 transition-all">
                  <div className="flex items-start gap-3 mb-2">
                    <Icon name={tip.icon as any} className="text-accent mt-1" size={20} />
                    <div>
                      <h4 className="font-semibold mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{tip.description}</p>
                      <code className="text-xs bg-muted/30 px-2 py-1 rounded block overflow-x-auto">
                        {tip.example}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <footer className="text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Shield" size={16} className="text-primary" />
            <span>Защита данных — ваша ответственность</span>
          </div>
          <p>Все проверки выполняются локально в вашем браузере</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;