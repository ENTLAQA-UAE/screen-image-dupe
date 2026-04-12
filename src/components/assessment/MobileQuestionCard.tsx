import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Option {
  text: string;
  value?: number;
}

interface Question {
  id: string;
  type: string;
  text: string;
  options: Option[];
}

interface MobileQuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answer: any;
  onAnswer: (questionId: string, value: any) => void;
  onMultiAnswer: (questionId: string, value: number, checked: boolean) => void;
  isArabic?: boolean;
  primaryColor?: string;
  swipeOffset?: number;
}

export function MobileQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onAnswer,
  onMultiAnswer,
  isArabic = false,
  primaryColor = '#3b82f6',
  swipeOffset = 0,
}: MobileQuestionCardProps) {
  const isMultiSelect = question.type === 'mcq_multi';

  return (
    <motion.div
      style={{ 
        x: swipeOffset,
        rotateZ: swipeOffset * 0.02,
      }}
      className="touch-pan-y"
    >
      <Card className="shadow-xl border-0 overflow-hidden mx-2 sm:mx-0">
        <CardContent className="p-4 sm:p-6 md:p-8" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          {/* Question number badge - mobile optimized */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
              }}
            >
              {questionIndex + 1}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {questionIndex + 1}/{totalQuestions}
            </span>
          </div>
          
          {/* Question text - larger touch target */}
          <h2 
            className={cn(
              "text-base sm:text-lg md:text-xl font-semibold mb-6 sm:mb-8 leading-relaxed text-foreground",
              isArabic ? 'text-right' : 'text-left'
            )}
            style={{ unicodeBidi: 'plaintext' }}
          >
            {question.text}
          </h2>

          {/* Options - larger touch targets for mobile */}
          {isMultiSelect ? (
            <div className="space-y-2 sm:space-y-3">
              {question.options.map((option, index) => {
                const optionValue = option.value ?? index;
                const isChecked = (answer || []).includes(optionValue);
                return (
                  <motion.div 
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all active:bg-blue-50",
                      isChecked 
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" 
                        : "border-slate-200 hover:border-blue-300"
                    )}
                    onClick={() => onMultiAnswer(question.id, optionValue, !isChecked)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => onMultiAnswer(question.id, optionValue, !!checked)}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <Label 
                      className={cn(
                        "flex-1 cursor-pointer text-sm sm:text-base text-foreground leading-relaxed",
                        isArabic ? 'text-right' : 'text-left'
                      )}
                      style={{ unicodeBidi: 'plaintext' }}
                    >
                      {option.text}
                    </Label>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <RadioGroup
              value={answer?.toString() || ""}
              onValueChange={(value) => onAnswer(question.id, parseInt(value))}
              className="space-y-2 sm:space-y-3"
            >
              {question.options.map((option, index) => {
                const optionValue = option.value ?? index;
                const isSelected = answer === optionValue;
                return (
                  <motion.div 
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all active:bg-blue-50",
                      isSelected 
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" 
                        : "border-slate-200 hover:border-blue-300"
                    )}
                    onClick={() => onAnswer(question.id, optionValue)}
                  >
                    <RadioGroupItem
                      value={optionValue.toString()}
                      id={`option-${index}`}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className={cn(
                        "flex-1 cursor-pointer text-sm sm:text-base text-foreground leading-relaxed",
                        isArabic ? 'text-right' : 'text-left'
                      )}
                      style={{ unicodeBidi: 'plaintext' }}
                    >
                      {option.text}
                    </Label>
                  </motion.div>
                );
              })}
            </RadioGroup>
          )}

          {/* Swipe hint for mobile - only show on first question */}
          {questionIndex === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center sm:hidden"
            >
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span>👆</span>
                <span>{isArabic ? 'اسحب للتنقل بين الأسئلة' : 'Swipe to navigate questions'}</span>
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
