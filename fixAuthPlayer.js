const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

const oldBottom = `                    <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 py-4">No data</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div 
        className={\`
          absolute md:relative bottom-0 inset-x-0`;

const newBottom = `                    <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 py-4">No data</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>)}
      </div>

      <div 
        className={\`
          absolute md:relative bottom-0 inset-x-0`;

c = c.replace(oldBottom, newBottom);
fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Fixed AuthPlayer.tsx");
