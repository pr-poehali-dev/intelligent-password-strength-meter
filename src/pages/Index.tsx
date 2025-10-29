import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

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



  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-12">
          <div className="inline-block mb-6">
            <Icon name="Shield" size={48} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Password Strength
          </h1>
          <p className="text-sm text-muted-foreground">
            Проверка стойкости пароля
          </p>
        </header>

        <div className="mb-8">
          <Card className="border-border/50 bg-card shadow-lg">
            <CardContent className="pt-6 space-y-6">
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Стойкость</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{analysis.score}%</span>
                        <Badge variant="outline" className={getLevelColor(analysis.level)}>
                          {getLevelText(analysis.level)}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(analysis.score)}`}
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                  </div>

                  {analysis.breachInfo?.compromised && (
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <Icon name="AlertTriangle" className="text-destructive" size={20} />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Найдено в {analysis.breachInfo.breach_count} утечках
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Clock" size={16} />
                      <span>Время взлома: <strong className="text-foreground">{analysis.timeToHack}</strong></span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(analysis.checks).map(([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 p-3 rounded-lg border ${
                            value ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/20 border-muted text-muted-foreground'
                          }`}
                        >
                          <Icon name={value ? 'Check' : 'X'} size={16} />
                          <span className="text-xs">
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

                    {analysis.feedback.length > 0 && (
                      <div className="space-y-1 pt-2 border-t">
                        {analysis.feedback.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        <footer className="text-center text-muted-foreground text-xs mt-8">
          <p>Проверка выполняется локально в браузере</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;